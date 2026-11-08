import React, { useState, useMemo } from 'react';
import { Item, Sale, VintedItem } from '../types';
import { isCostSet, isSameVintedItem } from '../services/matching';
import { formatEur, formatDays } from '../services/format';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Boxes,
  Copy,
  Check,
  Percent,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface DashboardTabProps {
  sales: Sale[];
  items?: Item[];
  vintedCatalog?: VintedItem[];
  onNavigateAdd?: () => void;
  onNavigateInventory?: () => void;
  onNavigateVinted?: () => void;
  onOpenSaleModal?: (item: Item, suggestedPrice?: number, channel?: string) => void;
}

type PeriodType = 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'ALL';

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sales,
  items = [],
  vintedCatalog = [],
  onNavigateInventory,
  onNavigateVinted,
  onOpenSaleModal
}) => {
  // Period filter piloting the whole dashboard
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('THIS_MONTH');

  // Tax Rate state
  const [taxRate, setTaxRate] = useState<number>(() => {
    const saved = localStorage.getItem('kozha_tax_rate');
    return saved !== null ? Number(saved) : 12.3;
  });

  // Copied state for URSSAF amount
  const [copiedUrssaf, setCopiedUrssaf] = useState(false);

  // Period label for subtitle
  const periodSubtitle = useMemo(() => {
    const now = new Date();
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    if (periodFilter === 'THIS_MONTH') {
      return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
    if (periodFilter === 'THIS_QUARTER') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return `T${q} ${now.getFullYear()}`;
    }
    if (periodFilter === 'THIS_YEAR') {
      return `Année ${now.getFullYear()}`;
    }
    return 'Historique complet';
  }, [periodFilter]);

  // Missing items on Vinted alert
  const missingOnVinted = useMemo(() => {
    return items.filter(item => !vintedCatalog.some(vnt => isSameVintedItem(item, vnt)));
  }, [items, vintedCatalog]);

  // Active stock valuation
  const stockCount = items.length;
  const stockCostValue = useMemo(() => {
    return items.reduce((acc, i) => {
      const costSet = isCostSet(i.purchasePrice);
      return acc + (costSet ? Number(i.purchasePrice) : 0);
    }, 0);
  }, [items]);

  const stockTargetValue = useMemo(() => {
    return items.reduce((acc, i) => {
      const costSet = isCostSet(i.purchasePrice);
      const cost = costSet ? Number(i.purchasePrice) : 0;
      const val = Number(i.targetPrice) || (costSet && cost > 0 ? cost * 2.5 : 0);
      return acc + val;
    }, 0);
  }, [items]);

  // Filtered sales according to active period
  const periodSales = useMemo(() => {
    return sales.filter(s => {
      if (periodFilter === 'ALL') return true;
      if (!s.saleDate) return false;
      const d = new Date(s.saleDate);
      const now = new Date();
      if (periodFilter === 'THIS_MONTH') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
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

  // Financial calculations
  const totalTurnover = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  }, [periodSales]);

  const totalCost = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + Number(s.purchasePrice || 0), 0);
  }, [periodSales]);

  const netMargin = totalTurnover - totalCost;
  const estimatedTax = Math.round(totalTurnover * (taxRate / 100) * 100) / 100;
  const netTurnoverAfterTax = Math.max(0, Math.round((totalTurnover - estimatedTax) * 100) / 100);
  const netProfitAfterTax = Math.round((netMargin - estimatedTax) * 100) / 100;

  const avgTicket = periodSales.length > 0 ? Math.round(totalTurnover / periodSales.length) : 0;

  const avgDays = useMemo(() => {
    if (periodSales.length === 0) return 0;
    const total = periodSales.reduce((acc, s) => {
      const pDate = s.purchaseDate || s.publishedDate;
      const days = pDate
        ? Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      return acc + days;
    }, 0);
    return Math.round(total / periodSales.length);
  }, [periodSales]);

  // Daily turnover for chart
  const dailyTurnoverData = useMemo(() => {
    const map = new Map<string, number>();
    periodSales.forEach(s => {
      const d = s.saleDate;
      if (!d) return;
      map.set(d, (map.get(d) || 0) + Number(s.salePrice));
    });

    const sortedDates = Array.from(map.keys()).sort();
    return sortedDates.map(dateStr => {
      const amt = map.get(dateStr) || 0;
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      return {
        date: dateStr,
        label,
        amount: amt
      };
    });
  }, [periodSales]);

  const maxDayAmount = useMemo(() => {
    if (dailyTurnoverData.length === 0) return 0;
    return Math.max(...dailyTurnoverData.map(d => d.amount));
  }, [dailyTurnoverData]);

  // Top Brands
  const sortedBrands = useMemo(() => {
    const brandMap: Record<string, { name: string; count: number; margin: number; totalDays: number }> = {};
    sales.forEach(s => {
      if (!brandMap[s.brand]) {
        brandMap[s.brand] = { name: s.brand, count: 0, margin: 0, totalDays: 0 };
      }
      brandMap[s.brand].count++;
      brandMap[s.brand].margin += (s.salePrice - (s.purchasePrice || 0));
      const pDate = s.purchaseDate || s.publishedDate;
      const days = pDate
        ? Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      brandMap[s.brand].totalDays += days;
    });
    return Object.values(brandMap).sort((a, b) => b.margin - a.margin).slice(0, 5);
  }, [sales]);

  // Fastest Sold Pieces
  const fastSales = useMemo(() => {
    return [...sales]
      .map(s => {
        const pDate = s.purchaseDate || s.publishedDate;
        const days = pDate
          ? Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 1;
        return { ...s, days, margin: s.salePrice - (s.purchasePrice || 0) };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 4);
  }, [sales]);

  // Channel comparison: only display if there is at least 1 non-Vinted sale
  const hasNonVintedSales = useMemo(() => {
    return sales.some(s => s.channel && s.channel !== 'Vinted');
  }, [sales]);

  const handleCopyUrssaf = () => {
    navigator.clipboard.writeText(totalTurnover.toFixed(2));
    setCopiedUrssaf(true);
    setTimeout(() => setCopiedUrssaf(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* 1. Titre & Sélecteur de période UNIQUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Activité comptable pour <span className="text-accent-light font-medium">{periodSubtitle}</span>
          </p>
        </div>

        {/* Sélecteur de période en segmented control arrondi */}
        <div className="inline-flex items-center p-1 bg-white/[0.03] border border-[rgba(255,190,220,0.10)] rounded-full self-start sm:self-auto">
          {(
            [
              { id: 'THIS_MONTH', label: 'Ce mois' },
              { id: 'THIS_QUARTER', label: 'Trimestre' },
              { id: 'THIS_YEAR', label: 'Année' },
              { id: 'ALL', label: 'Tout' }
            ] as const
          ).map(tab => {
            const isActive = periodFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPeriodFilter(tab.id)}
                className={`px-3 sm:px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-[rgba(255,143,192,0.18)] text-accent-pale shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bandeau d'alerte Synchro Vinted (uniquement si pièces disparues de Vinted) */}
      {missingOnVinted.length > 0 && (
        <div className="p-4 sm:p-5 rounded-[20px] bg-[rgba(255,95,162,0.08)] border border-[rgba(255,143,192,0.25)] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,95,162,0.20)] flex items-center justify-center shrink-0 text-accent mt-0.5 sm:mt-0">
              <AlertTriangle size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs sm:text-[13px] text-primary leading-snug">
                <strong className="text-accent-pale">{missingOnVinted[0].brand} {missingOnVinted[0].title}</strong> n'est plus en ligne sur Vinted. Vendu ?
              </p>
              {missingOnVinted.length > 1 && (
                <p className="text-[11px] text-secondary mt-0.5">
                  +{missingOnVinted.length - 1} autre(s) pièce(s) également absente(s) de Vinted
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onOpenSaleModal && (
              <button
                onClick={() => onOpenSaleModal(missingOnVinted[0], missingOnVinted[0].targetPrice, 'Vinted')}
                className="px-3.5 py-2 text-xs font-semibold rounded-full bg-accent text-[#2B0717] hover:brightness-110 active:scale-95 transition-all shadow-xs"
              >
                Enregistrer la vente ({formatEur(missingOnVinted[0].targetPrice)})
              </button>
            )}
            {missingOnVinted.length > 1 && onNavigateVinted && (
              <button
                onClick={onNavigateVinted}
                className="px-3 py-2 text-xs rounded-full btn-secondary-glossy"
              >
                Voir tout ({missingOnVinted.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. 4 Chiffres clés (grille responsive : 2 cols mobile avec CA en pleine largeur, auto-fit desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* 3.1 Chiffre d'affaires (CA) - Carte mise en avant rose glossy */}
        <div className="col-span-2 md:col-span-1 p-4 sm:p-5 card-hero-pink flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
          <div>
            <div className="text-xs text-[#2B0717]/80 font-medium">
              Chiffre d'affaires
            </div>
            <div className="text-[28px] sm:text-[34px] font-bold text-[#2B0717] tracking-tight leading-none mt-1.5 font-sans">
              {formatEur(totalTurnover)}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-[#2B0717]/80 font-medium mt-2">
            {formatEur(netMargin, true)} de marge brute
          </div>
        </div>

        {/* 3.2 Bénéfice net (après cotisations) */}
        <div className="col-span-1 p-4 sm:p-5 card-glossy flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
          <div>
            <div className="text-xs text-secondary font-normal">
              Bénéfice net
            </div>
            <div className="text-xl sm:text-2xl font-bold text-menthe tracking-tight mt-1.5 font-sans">
              {formatEur(netProfitAfterTax, true)}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-secondary mt-2 truncate">
            Net de cotisations ({taxRate}%)
          </div>
        </div>

        {/* 3.3 Valeur du stock */}
        <div className="col-span-1 p-4 sm:p-5 card-glossy flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
          <div>
            <div className="text-xs text-secondary font-normal">
              Valeur du stock
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary tracking-tight mt-1.5 font-sans">
              {formatEur(stockTargetValue)}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-secondary mt-2 truncate">
            {stockCount} pièces · {formatEur(stockCostValue)} investis
          </div>
        </div>

        {/* 3.4 Ventes */}
        <div className="col-span-2 md:col-span-1 p-4 sm:p-5 card-glossy flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
          <div>
            <div className="text-xs text-secondary font-normal">
              Ventes
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary tracking-tight mt-1.5 font-sans">
              {periodSales.length} pièces
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-secondary mt-2 truncate">
            Panier {formatEur(avgTicket)} · vendu en {avgDays} j
          </div>
        </div>

      </div>

      {/* 4. Graphique "Chiffre d'affaires par jour" */}
      <div className="p-4 sm:p-6 card-glossy">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-primary">
              Chiffre d'affaires par jour
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Évolution des ventes sur la période sélectionnée
            </p>
          </div>
          <span className="text-xs text-secondary font-mono">
            Total : {formatEur(totalTurnover)}
          </span>
        </div>

        {dailyTurnoverData.length === 0 ? (
          <div className="py-10 text-center text-xs text-secondary">
            Aucune vente enregistrée sur cette période.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[420px] flex items-end gap-3 sm:gap-4 h-40 pt-8 px-2 border-b border-[rgba(255,190,220,0.08)]">
              {dailyTurnoverData.map((d) => {
                const isBest = maxDayAmount > 0 && d.amount === maxDayAmount;
                const heightPercent = maxDayAmount > 0 ? Math.max(12, Math.round((d.amount / maxDayAmount) * 100)) : 12;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                    {/* Montant au-dessus */}
                    <span className={`text-[10px] sm:text-[11px] font-mono mb-1.5 transition-all ${
                      isBest ? 'text-accent-pale font-bold' : 'text-secondary group-hover:text-primary'
                    }`}>
                      {formatEur(d.amount)}
                    </span>

                    {/* Barre */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-md transition-all ${
                        isBest
                          ? 'bg-gradient-to-t from-accent to-accent-light shadow-[0_0_12px_rgba(255,95,162,0.4)]'
                          : 'bg-[rgba(255,95,162,0.22)] hover:bg-[rgba(255,95,162,0.40)]'
                      }`}
                    />

                    {/* Jour en dessous */}
                    <span className="text-[10px] sm:text-[11px] text-tertiary mt-2 whitespace-nowrap">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Carte compacte "À déclarer à l'URSSAF" */}
      <div className="p-4 sm:p-5 card-glossy">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,190,220,0.07)]">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-primary">
              À déclarer à l'URSSAF
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Chiffre d'affaires brut encaissé pour vos déclarations micro-BIC
            </p>
          </div>

          {/* Sélecteur de taux compact */}
          <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto bg-white/[0.03] border border-[rgba(255,190,220,0.10)] px-2.5 py-1 rounded-full">
            <Percent size={12} className="text-accent" />
            <span className="text-secondary text-[11px]">Taux :</span>
            <select
              value={taxRate}
              onChange={e => {
                const val = Number(e.target.value);
                setTaxRate(val);
                localStorage.setItem('kozha_tax_rate', String(val));
              }}
              className="bg-transparent text-xs font-semibold text-primary outline-none cursor-pointer"
            >
              <option value={12.3} className="bg-[#17111A] text-primary">12.3% (Achat-Revente)</option>
              <option value={13.3} className="bg-[#17111A] text-primary">13.3% (+ Impôt 1%)</option>
              <option value={0} className="bg-[#17111A] text-primary">0% (Non assujetti)</option>
              <option value={21.2} className="bg-[#17111A] text-primary">21.2% (Prestations)</option>
            </select>
          </div>
        </div>

        {/* Détails compacts */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-primary font-sans">
                {formatEur(totalTurnover)}
              </span>
              <span className="text-xs text-secondary">brut encaissé</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-corail">
                Cotisations ({taxRate}%) : -{formatEur(estimatedTax)}
              </span>
              <span className="text-secondary">
                CA net de cotisations : <strong className="text-primary">{formatEur(netTurnoverAfterTax)}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyUrssaf}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-full btn-secondary-glossy cursor-pointer"
          >
            {copiedUrssaf ? <Check size={14} className="text-menthe" /> : <Copy size={14} />}
            <span>{copiedUrssaf ? 'Copié !' : 'Copier le montant'}</span>
          </button>
        </div>
      </div>

      {/* 6. Deux colonnes : Meilleures marques & Vendues en 24h */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Colonne 1: Meilleures marques */}
        <div className="p-4 sm:p-5 card-glossy">
          <h2 className="text-sm sm:text-base font-semibold text-primary mb-1">
            Meilleures marques
          </h2>
          <p className="text-xs text-secondary mb-4">
            Classement selon le bénéfice net réalisé
          </p>

          {sortedBrands.length === 0 ? (
            <div className="py-6 text-center text-xs text-secondary">
              Aucune vente enregistrée.
            </div>
          ) : (
            <div className="divide-y divide-[rgba(255,190,220,0.07)]">
              {sortedBrands.map((b, idx) => {
                const avgD = Math.round(b.totalDays / b.count);
                return (
                  <div key={b.name} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-accent-light w-6">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs sm:text-[13px] font-semibold text-primary">
                          {b.name}
                        </div>
                        <div className="text-[11px] text-secondary">
                          {b.count} pièce(s) · vendues en {avgD} j
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs sm:text-sm font-semibold text-menthe font-sans">
                      {formatEur(b.margin, true)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne 2: Vendues en 24h (Délai court) */}
        <div className="p-4 sm:p-5 card-glossy">
          <h2 className="text-sm sm:text-base font-semibold text-primary mb-1">
            Vendues rapidement
          </h2>
          <p className="text-xs text-secondary mb-4">
            Pièces écoulées dans les délais les plus brefs
          </p>

          {fastSales.length === 0 ? (
            <div className="py-6 text-center text-xs text-secondary">
              Aucune donnée de rotation disponible.
            </div>
          ) : (
            <div className="divide-y divide-[rgba(255,190,220,0.07)]">
              {fastSales.map(item => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs sm:text-[13px] font-semibold text-primary truncate">
                      {item.brand} — {item.title}
                    </div>
                    <div className="text-[11px] text-secondary">
                      Achat {formatEur(item.purchasePrice)} · Vendu en {item.days} j
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-semibold text-menthe font-sans">
                      {formatEur(item.margin, true)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Affichage conditionnel canaux de vente si ventes hors Vinted */}
      {hasNonVintedSales && (
        <div className="p-4 sm:p-5 card-glossy">
          <h2 className="text-sm sm:text-base font-semibold text-primary mb-3">
            Canaux de vente
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-[rgba(255,190,220,0.07)]">
              <div className="text-xs text-secondary">Vinted</div>
              <div className="text-lg font-bold text-primary mt-1">
                {formatEur(sales.filter(s => s.channel === 'Vinted').reduce((acc, s) => acc + s.salePrice, 0))}
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-[rgba(255,190,220,0.07)]">
              <div className="text-xs text-secondary">Direct & Pop-up</div>
              <div className="text-lg font-bold text-primary mt-1">
                {formatEur(sales.filter(s => s.channel !== 'Vinted').reduce((acc, s) => acc + s.salePrice, 0))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
