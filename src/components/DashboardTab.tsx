import React, { useState, useMemo } from 'react';
import { Item, Sale } from '../types';
import { isCostSet } from '../services/matching';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  Store,
  Globe,
  Search,
  Filter,
  Package,
  Boxes,
  ArrowRight,
  FileText,
  Calculator,
  Receipt,
  Percent,
  Coins
} from 'lucide-react';

interface DashboardTabProps {
  sales: Sale[];
  items?: Item[];
  onNavigateAdd: () => void;
  onNavigateInventory?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sales,
  items = [],
  onNavigateAdd,
  onNavigateInventory
}) => {
  const [salesSearch, setSalesSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'Vinted' | 'Flea Market' | 'Direct'>('ALL');
  
  // Tax & Fiscal state
  const [taxRate, setTaxRate] = useState<number>(() => {
    const saved = localStorage.getItem('kozha_tax_rate');
    return saved !== null ? Number(saved) : 12.3;
  });
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR'>('ALL');

  // Active Stock Valuation calculations
  const stockCount = items.length;
  const stockTargetValue = items.reduce((acc, i) => {
    const costSet = isCostSet(i.purchasePrice);
    const cost = costSet ? Number(i.purchasePrice) : 0;
    const val = Number(i.targetPrice) || (costSet && cost > 0 ? cost * 2.5 : 0);
    return acc + val;
  }, 0);
  const stockCostValue = items.reduce((acc, i) => {
    const costSet = isCostSet(i.purchasePrice);
    return acc + (costSet ? Number(i.purchasePrice) : 0);
  }, 0);
  const potentialProfit = stockTargetValue - stockCostValue;
  const avgItemPrice = stockCount > 0 ? Math.round(stockTargetValue / stockCount) : 0;

  // Period filtering for sales & tax calculations
  const periodSales = useMemo(() => {
    return sales.filter(s => {
      if (periodFilter === 'ALL') return true;
      if (!s.saleDate) return false;
      const d = new Date(s.saleDate);
      const now = new Date();
      if (periodFilter === 'THIS_MONTH') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (periodFilter === 'LAST_MONTH') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
      }
      if (periodFilter === 'THIS_QUARTER') {
        const curQ = Math.floor(now.getMonth() / 3);
        const saleQ = Math.floor(d.getMonth() / 3);
        return d.getFullYear() === now.getFullYear() && curQ === saleQ;
      }
      if (periodFilter === 'THIS_YEAR') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, periodFilter]);

  // Financial calculations from completed sales (filtered by period)
  const totalTurnover = periodSales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const totalCost = periodSales.reduce((acc, s) => acc + Number(s.purchasePrice || 0), 0);
  const netMargin = totalTurnover - totalCost;
  
  // Tax & Net Revenue calculations
  const estimatedTax = Math.round(totalTurnover * (taxRate / 100) * 100) / 100;
  const netTurnoverAfterTax = Math.max(0, Math.round((totalTurnover - estimatedTax) * 100) / 100);
  const netProfitAfterTax = Math.round((netMargin - estimatedTax) * 100) / 100;
  
  const avgRoi = totalCost > 0 ? Math.round((netMargin / totalCost) * 100) : (totalTurnover > 0 ? 100 : 0);
  const avgTicket = periodSales.length > 0 ? Math.round(totalTurnover / periodSales.length) : 0;

  let totalDays = 0;
  periodSales.forEach(s => {
    const days = Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(s.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
    totalDays += days;
  });
  const avgDays = periodSales.length > 0 ? Math.round(totalDays / periodSales.length) : 0;

  // Channel metrics
  const vintedSales = sales.filter(s => s.channel === 'Vinted');
  const inPersonSales = sales.filter(s => s.channel !== 'Vinted');
  
  const vCA = vintedSales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const vCost = vintedSales.reduce((acc, s) => acc + Number(s.purchasePrice), 0);
  const vMargin = vCA - vCost;
  
  const mCA = inPersonSales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const mCost = inPersonSales.reduce((acc, s) => acc + Number(s.purchasePrice), 0);
  const mMargin = mCA - mCost;

  // Brand statistics
  const brandStats: Record<string, { name: string; count: number; margin: number; totalDays: number }> = {};
  sales.forEach(s => {
    if (!brandStats[s.brand]) {
      brandStats[s.brand] = { name: s.brand, count: 0, margin: 0, totalDays: 0 };
    }
    brandStats[s.brand].count++;
    brandStats[s.brand].margin += (s.salePrice - s.purchasePrice);
    const days = Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(s.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
    brandStats[s.brand].totalDays += days;
  });
  const sortedBrands = Object.values(brandStats).sort((a, b) => b.margin - a.margin);

  // Fast Sales
  const fastSales = [...sales]
    .map(s => {
      const days = Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(s.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
      return { ...s, days, margin: s.salePrice - s.purchasePrice };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  // Filtered sales ledger
  const filteredSales = sales.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.brand.toLowerCase().includes(salesSearch.toLowerCase());
    const matchesChannel =
      channelFilter === 'ALL' ||
      (channelFilter === 'Vinted' && s.channel === 'Vinted') ||
      (channelFilter === 'Flea Market' && s.channel === 'Flea Market') ||
      (channelFilter === 'Direct' && s.channel === 'Direct');
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. ACTIVE STOCK VALUATION */}
      <section className="bg-surface border border-border rounded-md p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Boxes size={18} className="text-accent" />
              <h2 className="font-heading text-lg sm:text-xl font-bold text-primary">
                Active Stock Valuation
              </h2>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Live estimated value of your active unsold inventory ({stockCount} pieces in stock).
            </p>
          </div>
          {onNavigateInventory && (
            <button
              onClick={onNavigateInventory}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline font-mono"
            >
              <span>View Inventory</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Estimated Resale Value */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Est. Stock Value</span>
              <DollarSign size={14} className="text-accent shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-primary truncate">
              {stockTargetValue.toLocaleString('en-US')} €
            </div>
            <div className="text-[11px] sm:text-xs text-secondary mt-1 truncate">
              Target resale price
            </div>
          </div>

          {/* Invested Capital / Purchase Cost */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Invested Capital</span>
              <Package size={14} className="text-tertiary shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-secondary truncate">
              {stockCostValue.toLocaleString('en-US')} €
            </div>
            <div className="text-[11px] sm:text-xs text-secondary mt-1 truncate">
              Acquisition cost paid
            </div>
          </div>

          {/* Potential Net Margin */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Potential Margin</span>
              <TrendingUp size={14} className="text-profit shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-profit truncate">
              +{potentialProfit.toLocaleString('en-US')} €
            </div>
            <div className="text-[11px] sm:text-xs text-profit font-medium mt-1 truncate">
              Unrealized profit
            </div>
          </div>

          {/* Stock Count & Avg Price */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Stock Count</span>
              <Boxes size={14} className="text-accent shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-primary truncate">
              {stockCount} pcs
            </div>
            <div className="text-[11px] sm:text-xs text-secondary mt-1 font-mono truncate">
              ~{avgItemPrice} € avg / piece
            </div>
          </div>
        </div>
      </section>

      {/* 2. REALIZED SALES, TAX & FINANCIAL KPIS */}
      <section className="bg-surface border border-border rounded-md p-5 sm:p-6 shadow-sm space-y-4">
        {/* Header with Title, Period Filter & Tax Configuration */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-accent" />
              <h2 className="font-heading text-lg sm:text-xl font-bold text-primary">
                Ventes, Fiscalité & Déclaration
              </h2>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Montant brut à déclarer, cotisations estimées et revenu net réel après impôts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filter Buttons */}
            <div className="flex items-center bg-surface-subtle border border-border rounded-sm p-0.5 text-xs">
              <button
                onClick={() => setPeriodFilter('ALL')}
                className={`px-2 py-1 rounded-xs transition-colors font-mono text-[11px] ${
                  periodFilter === 'ALL'
                    ? 'bg-surface text-primary font-bold shadow-xs border border-border'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Tout ({sales.length})
              </button>
              <button
                onClick={() => setPeriodFilter('THIS_MONTH')}
                className={`px-2 py-1 rounded-xs transition-colors font-mono text-[11px] ${
                  periodFilter === 'THIS_MONTH'
                    ? 'bg-surface text-primary font-bold shadow-xs border border-border'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Ce mois
              </button>
              <button
                onClick={() => setPeriodFilter('THIS_QUARTER')}
                className={`px-2 py-1 rounded-xs transition-colors font-mono text-[11px] ${
                  periodFilter === 'THIS_QUARTER'
                    ? 'bg-surface text-primary font-bold shadow-xs border border-border'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Trimestre
              </button>
              <button
                onClick={() => setPeriodFilter('THIS_YEAR')}
                className={`px-2 py-1 rounded-xs transition-colors font-mono text-[11px] ${
                  periodFilter === 'THIS_YEAR'
                    ? 'bg-surface text-primary font-bold shadow-xs border border-border'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Année
              </button>
            </div>

            {/* Tax Rate Selector */}
            <div className="flex items-center gap-1.5 bg-surface-subtle border border-border rounded-sm px-2.5 py-1 text-xs">
              <Percent size={12} className="text-accent" />
              <span className="text-[11px] text-secondary">Taux :</span>
              <select
                value={taxRate}
                onChange={e => {
                  const val = Number(e.target.value);
                  setTaxRate(val);
                  localStorage.setItem('kozha_tax_rate', String(val));
                }}
                className="bg-transparent font-mono text-xs font-bold text-primary outline-none cursor-pointer"
              >
                <option value={12.3}>12.3% (URSSAF Achat-Revente)</option>
                <option value={13.3}>13.3% (+ Impôt Libératoire 1%)</option>
                <option value={0}>0% (Non assujetti)</option>
                <option value={21.2}>21.2% (Prestations)</option>
                <option value={15}>15% (Autre)</option>
                <option value={20}>20% (TVA)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6 Metric Cards in 2 columns on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          
          {/* 1. Montant à déclarer (CA Brut) */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border-2 border-accent/40 rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-accent font-bold mb-1">
              <span className="truncate">Montant à déclarer</span>
              <FileText size={14} className="text-accent shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-primary truncate">
              {totalTurnover.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[11px] text-secondary mt-1 flex items-center justify-between">
              <span className="truncate">CA brut encaissé</span>
              <span className="font-mono font-bold text-[10px] text-accent bg-accent/10 px-1 rounded-xs">
                URSSAF
              </span>
            </div>
          </div>

          {/* 2. Revenu net après taxe (Bénéfice net restant) */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border-2 border-profit/40 rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-profit font-bold mb-1">
              <span className="truncate">Revenu après taxe</span>
              <Coins size={14} className="text-profit shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-profit truncate">
              +{netProfitAfterTax.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[11px] text-profit font-medium mt-1 truncate">
              Net réel en poche
            </div>
          </div>

          {/* 3. Cotisations & Taxes estimées */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Taxes ({taxRate}%)</span>
              <Receipt size={14} className="text-amber-500 shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 truncate">
              -{estimatedTax.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[11px] text-secondary mt-1 truncate">
              Cotisations dues
            </div>
          </div>

          {/* 4. Marge brute (Avant taxes) */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Marge brute</span>
              <TrendingUp size={14} className="text-profit shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-profit truncate">
              +{netMargin.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[11px] text-secondary mt-1 font-mono truncate">
              ROI : +{avgRoi}%
            </div>
          </div>

          {/* 5. Panier moyen */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Panier moyen</span>
              <ShoppingBag size={14} className="text-tertiary shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-primary truncate">
              {avgTicket.toLocaleString('fr-FR')} €
            </div>
            <div className="text-[11px] text-secondary mt-1 truncate">
              Prix moyen / vente
            </div>
          </div>

          {/* 6. Délai moyen de vente */}
          <div className="p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-sm">
            <div className="flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-wider text-secondary mb-1">
              <span className="truncate">Délai de vente</span>
              <Clock size={14} className="text-accent shrink-0 ml-1" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-primary truncate">
              {avgDays} Jours
            </div>
            <div className="text-[11px] text-accent font-medium mt-1 truncate">
              Vitesse d'écoulement
            </div>
          </div>

        </div>

        {/* Info callout for declaration guidance */}
        <div className="bg-surface border border-border/80 rounded-sm p-3 text-[11px] text-secondary flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-accent text-[10px] px-1.5 py-0.5 bg-accent/10 rounded-xs">
              Déclaration URSSAF / Impôts
            </span>
            <span>
              En achat-revente de biens (micro-BIC), déclarez le <strong>Chiffre d'Affaires brut encaissé</strong> ({totalTurnover.toLocaleString('fr-FR')} €).
            </span>
          </div>
          <div className="font-mono text-[11px] text-primary">
            CA net de cotisations : <strong className="text-primary">{netTurnoverAfterTax.toLocaleString('fr-FR')} €</strong>
          </div>
        </div>
      </section>

      {/* 2. CHANNELS COMPARISON */}
      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">
              Sales Channel Comparison
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Net margin comparison by distribution channel.
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-tertiary">
            Vinted vs In-Person
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-surface-subtle rounded-sm border-l-4 border-accent">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-accent font-bold mb-2">
              <span className="flex items-center gap-1.5"><Globe size={13} /> Vinted Sales</span>
              <span className="font-mono">{vintedSales.length} sale(s)</span>
            </div>
            <div className="font-mono text-2xl font-bold text-primary my-1">{vCA.toLocaleString('en-US')} €</div>
            <div className="text-xs text-secondary">
              Net margin: <strong className="text-profit">+{vMargin} €</strong> ({vCost > 0 ? Math.round((vMargin / vCost) * 100) : (vCA > 0 ? 100 : 0)}% ROI)
            </div>
          </div>

          <div className="p-5 bg-surface-subtle rounded-sm border-l-4 border-profit">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-profit font-bold mb-2">
              <span className="flex items-center gap-1.5"><Store size={13} /> Flea Market & In-Person Sales</span>
              <span className="font-mono">{inPersonSales.length} sale(s)</span>
            </div>
            <div className="font-mono text-2xl font-bold text-primary my-1">{mCA.toLocaleString('en-US')} €</div>
            <div className="text-xs text-secondary">
              Net margin: <strong className="text-profit">+{mMargin} €</strong> ({mCost > 0 ? Math.round((mMargin / mCost) * 100) : (mCA > 0 ? 100 : 0)}% ROI)
            </div>
          </div>
        </div>
      </div>

      {/* 3. BRAND PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Brands Performance */}
        <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
          <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
            <h2 className="font-heading text-xl font-bold text-primary">Top Brands Performance</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-tertiary">Net Profit</span>
          </div>

          {sortedBrands.length === 0 ? (
            <div className="py-8 text-center text-xs text-secondary">
              No brand sales data recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedBrands.slice(0, 5).map((b, idx) => {
                const avgD = Math.round(b.totalDays / b.count);
                return (
                  <div key={b.name} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-accent w-7">
                        #0{idx + 1}
                      </span>
                      <div>
                        <div className="font-heading font-bold text-base text-primary">{b.name}</div>
                        <div className="text-xs text-secondary">
                          {b.count} piece(s) · Avg sell time: {avgD}d
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-profit text-base">+{b.margin} €</div>
                      <span className="font-mono text-[11px] text-profit bg-profit-soft px-1.5 py-0.5 rounded-sm">
                        {avgD <= 7 ? 'Fast Moving' : 'Steady'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fastest Sold Pieces */}
        <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
          <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
            <h2 className="font-heading text-xl font-bold text-primary">Fastest Sold Pieces</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-tertiary">Turnover Velocity</span>
          </div>
          <p className="text-xs text-secondary mb-4">
            Items that sold fastest along with realized profitability:
          </p>

          {fastSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-secondary">
              No turnover data available yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {fastSales.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-base text-primary">
                      {item.brand} — {item.title}
                    </div>
                    <div className="text-xs text-secondary">
                      Bought {item.purchasePrice} € &rarr; Sold {item.salePrice} € ({item.channel})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-profit">+{item.margin} €</div>
                    <div className="font-mono text-xs text-accent">Sold in {item.days}d</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. DETAILED SALES LEDGER */}
      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-baseline gap-4 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">Detailed Sales Ledger</h2>
            <p className="text-xs text-secondary mt-0.5">
              Certified history with net margin calculation (€ and %), ROI, and turnover time.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-tertiary">
            {filteredSales.length} Sales
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Search sales by brand or item title..."
              value={salesSearch}
              onChange={e => setSalesSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-tertiary" />
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value as any)}
              className="py-1.5 px-3 text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              <option value="ALL">All Channels</option>
              <option value="Vinted">Vinted only</option>
              <option value="Flea Market">Flea Market only</option>
              <option value="Direct">Direct Sale</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-border rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border-strong bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 w-14">Photo</th>
                <th className="py-2.5 px-3">Item Sold</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Sale Price</th>
                <th className="py-2.5 px-3">Cost Price</th>
                <th className="py-2.5 px-3">Net Margin</th>
                <th className="py-2.5 px-3">ROI</th>
                <th className="py-2.5 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-secondary">
                    No sales recorded yet. Once an item is sold, it will be listed in this ledger.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const margin = sale.salePrice - Number(sale.purchasePrice || 0);
                  const cost = Number(sale.purchasePrice || 0);
                  const roi = cost > 0 ? Math.round((margin / cost) * 100) : 100;
                  const days = Math.max(1, Math.round((new Date(sale.saleDate).getTime() - new Date(sale.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));

                  return (
                    <tr key={sale.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-tertiary">
                        {sale.saleDate}
                      </td>
                      <td className="py-3 px-3">
                        {sale.photo ? (
                          <img
                            src={sale.photo}
                            alt={sale.title}
                            className="w-11 h-11 object-cover rounded-sm border border-border"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-sm bg-surface-subtle border border-dashed border-border-strong flex items-center justify-center text-secondary">
                            <Package size={14} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-heading font-bold text-sm text-primary">{sale.brand}</div>
                        <div className="text-xs text-secondary">{sale.title}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                            sale.channel === 'Vinted'
                              ? 'bg-accent-soft text-accent border border-accent/25'
                              : 'bg-profit-soft text-profit border border-profit/25'
                          }`}
                        >
                          {sale.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold text-primary">
                        {sale.salePrice} €
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-secondary">
                        {sale.purchasePrice} €
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold text-profit">
                        +{margin} €
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-profit font-semibold">
                        +{roi}%
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-accent font-semibold">
                        {days}d
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
