import React, { useState } from 'react';
import { Sale } from '../types';
import { TrendingUp, ShoppingBag, DollarSign, Clock, Store, Globe, Search, Filter } from 'lucide-react';

interface DashboardTabProps {
  sales: Sale[];
  onNavigateAdd: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ sales, onNavigateAdd }) => {
  const [salesSearch, setSalesSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'Vinted' | 'Marché' | 'Direct'>('ALL');

  if (sales.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-surface-subtle border border-border flex items-center justify-center mx-auto mb-4 text-2xl">
          📊
        </div>
        <h2 className="font-heading text-2xl font-bold text-primary mb-2">
          Tableau de Bord des Ventes
        </h2>
        <p className="text-xs text-secondary max-w-md mx-auto mb-6">
          Aucune vente enregistrée pour le moment. Dès que vous enregistrez une vente (sur Vinted ou sur un marché), cet onglet affichera vos chiffres clés, votre marge nette réelle, le comparatif des canaux et l'historique complet de vos ventes.
        </p>
        <button
          onClick={onNavigateAdd}
          className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 transition-all shadow-sm"
        >
          + Enregistrer un vêtement en stock
        </button>
      </div>
    );
  }

  // Calculs financiers réels
  const totalTurnover = sales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const totalCost = sales.reduce((acc, s) => acc + Number(s.purchasePrice), 0);
  const netMargin = totalTurnover - totalCost;
  const avgRoi = totalCost > 0 ? Math.round((netMargin / totalCost) * 100) : 0;

  let totalDays = 0;
  sales.forEach(s => {
    const days = Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(s.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
    totalDays += days;
  });
  const avgDays = sales.length > 0 ? Math.round(totalDays / sales.length) : 0;

  // Stats par canal
  const vintedSales = sales.filter(s => s.channel === 'Vinted');
  const marcheSales = sales.filter(s => s.channel === 'Marché');
  
  const vCA = vintedSales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const vCost = vintedSales.reduce((acc, s) => acc + Number(s.purchasePrice), 0);
  const vMargin = vCA - vCost;
  
  const mCA = marcheSales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const mCost = marcheSales.reduce((acc, s) => acc + Number(s.purchasePrice), 0);
  const mMargin = mCA - mCost;

  // Stats par marque
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

  // Vente Facile
  const fastSales = [...sales]
    .map(s => {
      const days = Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(s.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
      return { ...s, days, margin: s.salePrice - s.purchasePrice };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  // Filtrage du journal des ventes
  const filteredSales = sales.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.brand.toLowerCase().includes(salesSearch.toLowerCase());
    const matchesChannel = channelFilter === 'ALL' || s.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. GRILLE DES KPIS FINANCIERS DES VENTES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border bg-surface rounded-md overflow-hidden shadow-sm">
        <div className="p-5 border-b sm:border-r border-border">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
            <span>Chiffre d'Affaires</span>
            <DollarSign size={14} className="text-accent" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">
            {totalTurnover.toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-secondary mt-1">
            Total sur {sales.length} vente(s) clôturée(s)
          </div>
        </div>

        <div className="p-5 border-b lg:border-r border-border">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
            <span>Bénéfice Net Réel</span>
            <TrendingUp size={14} className="text-profit" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-profit">
            +{netMargin.toLocaleString('fr-FR')} €
          </div>
          <div className="font-mono text-xs text-profit font-medium mt-1">
            ROI Moyen : +{avgRoi}%
          </div>
        </div>

        <div className="p-5 border-b sm:border-r border-border">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
            <span>Ticket Moyen</span>
            <ShoppingBag size={14} className="text-tertiary" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">
            {sales.length > 0 ? Math.round(totalTurnover / sales.length) : 0} €
          </div>
          <div className="text-xs text-secondary mt-1">
            Panier moyen par vente
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
            <span>Vélocité Moyenne</span>
            <Clock size={14} className="text-accent" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">
            {avgDays} Jours
          </div>
          <div className="text-xs text-accent font-medium mt-1">
            ⚡ Délai d'écoulement moyen
          </div>
        </div>
      </section>

      {/* 2. DUEL DES CANAUX : VINTED VS MARCHÉS */}
      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">
              Comparatif des Canaux de Vente
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Où gagne-t-elle le plus d'argent net pour le temps investi ?
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-tertiary">
            Vinted vs Marchés
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-surface-subtle rounded-sm border-l-4 border-accent">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-accent font-bold mb-2">
              <span className="flex items-center gap-1.5"><Globe size={13} /> Ventes Vinted</span>
              <span className="font-mono">{vintedSales.length} vente(s)</span>
            </div>
            <div className="font-mono text-2xl font-bold text-primary my-1">{vCA.toLocaleString('fr-FR')} €</div>
            <div className="text-xs text-secondary">
              Marge nette : <strong className="text-profit">+{vMargin} €</strong> ({vCost > 0 ? Math.round((vMargin / vCost) * 100) : 0}% ROI)
            </div>
          </div>

          <div className="p-5 bg-surface-subtle rounded-sm border-l-4 border-profit">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-profit font-bold mb-2">
              <span className="flex items-center gap-1.5"><Store size={13} /> Ventes Marchés & Salons</span>
              <span className="font-mono">{marcheSales.length} vente(s)</span>
            </div>
            <div className="font-mono text-2xl font-bold text-primary my-1">{mCA.toLocaleString('fr-FR')} €</div>
            <div className="text-xs text-secondary">
              Marge nette : <strong className="text-profit">+{mMargin} €</strong> ({mCost > 0 ? Math.round((mMargin / mCost) * 100) : 0}% ROI)
            </div>
          </div>
        </div>
      </div>

      {/* 3. RADAR DES MARQUES & HIT-PARADE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hit-Parade des Marques */}
        <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
          <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
            <h2 className="font-heading text-xl font-bold text-primary">Hit-Parade des Marques</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-tertiary">Marge Réelle</span>
          </div>

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
                        {b.count} pièce(s) · Écoulement moyen : {avgD} j
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-profit text-base">+{b.margin} €</div>
                    <span className="font-mono text-[11px] text-profit bg-profit-soft px-1.5 py-0.5 rounded-sm">
                      ⚡ {avgD <= 7 ? 'Ultra Rapide' : 'Fluide'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indice Vente Facile */}
        <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
          <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
            <h2 className="font-heading text-xl font-bold text-primary">Indice "Vente Facile"</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-tertiary">Vélocité Record</span>
          </div>
          <p className="text-xs text-secondary mb-4">
            Les pièces vendues le plus rapidement avec leur rentabilité :
          </p>

          <div className="divide-y divide-border">
            {fastSales.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-heading font-bold text-base text-primary">
                    {item.brand} — {item.title}
                  </div>
                  <div className="text-xs text-secondary">
                    Acheté {item.purchasePrice} € ➔ Vendu {item.salePrice} € ({item.channel})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-profit">+{item.margin} €</div>
                  <div className="font-mono text-xs text-accent">Parti en {item.days} j</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. LE JOURNAL DES VENTES DÉTAILLÉ */}
      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-baseline gap-4 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">Journal Détaillé des Ventes</h2>
            <p className="text-xs text-secondary mt-0.5">
              Historique certifié avec calcul de la marge nette (€ et %), du ROI et du délai de vente.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-tertiary">
            {filteredSales.length} Ventes
          </span>
        </div>

        {/* Filtres du Journal */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Rechercher une vente par marque ou vêtement..."
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
              <option value="ALL">Tous les Canaux</option>
              <option value="Vinted">Vinted uniquement</option>
              <option value="Marché">Marché uniquement</option>
              <option value="Direct">Vente directe</option>
            </select>
          </div>
        </div>

        {/* Table du Journal */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-border rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border-strong bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 w-14">Photo</th>
                <th className="py-2.5 px-3">Pièce Vendue</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Prix Vendu</th>
                <th className="py-2.5 px-3">Coût Achat</th>
                <th className="py-2.5 px-3">Marge Nette</th>
                <th className="py-2.5 px-3">ROI</th>
                <th className="py-2.5 px-3">Délai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSales.map(sale => {
                const margin = sale.salePrice - sale.purchasePrice;
                const roi = sale.purchasePrice > 0 ? Math.round((margin / sale.purchasePrice) * 100) : 0;
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
                        <div className="w-11 h-11 rounded-sm bg-surface-subtle border border-dashed border-border-strong flex items-center justify-center text-sm">
                          ✓
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
                      {days} j
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
