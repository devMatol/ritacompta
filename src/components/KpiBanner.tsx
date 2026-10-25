import React from 'react';
import { Item, Sale } from '../types';

interface KpiBannerProps {
  items: Item[];
  sales: Sale[];
}

export const KpiBanner: React.FC<KpiBannerProps> = ({ items, sales }) => {
  const totalTurnover = sales.reduce((acc, s) => acc + Number(s.salePrice), 0);
  const totalCost = sales.reduce((acc, s) => acc + Number(s.purchasePrice), 0);
  const netMargin = totalTurnover - totalCost;
  const avgRoi = totalCost > 0 ? Math.round((netMargin / totalCost) * 100) : 0;

  const stockPurchaseTotal = items.reduce((acc, i) => acc + Number(i.purchasePrice), 0);
  const stockTargetTotal = items.reduce((acc, i) => acc + Number(i.targetPrice || (i.purchasePrice * 2.5)), 0);

  let totalDays = 0;
  sales.forEach(s => {
    const days = Math.max(1, Math.round((new Date(s.saleDate).getTime() - new Date(s.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)));
    totalDays += days;
  });
  const avgDays = sales.length > 0 ? Math.round(totalDays / sales.length) : 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border bg-surface rounded-md overflow-hidden mb-8 shadow-sm">
      <div className="p-5 border-b sm:border-r border-border">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
          <span>Chiffre d'Affaires</span>
          <span className="text-[10px]">Net Encaissé</span>
        </div>
        <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">
          {totalTurnover.toLocaleString('fr-FR')} €
        </div>
        <div className="text-xs text-profit font-medium mt-1">
          ↗ {sales.length} pièces vendues
        </div>
      </div>

      <div className="p-5 border-b lg:border-r border-border">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
          <span>Bénéfice Net Réel</span>
          <span className="text-[10px]">Marge Brute</span>
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
          <span>Valeur du Stock Actif</span>
          <span className="text-[10px]">Prix Achat</span>
        </div>
        <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">
          {stockPurchaseTotal.toLocaleString('fr-FR')} €
        </div>
        <div className="text-xs text-secondary mt-1">
          Potentiel vente : ~{stockTargetTotal.toLocaleString('fr-FR')} €
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-secondary mb-1">
          <span>Vélocité Vente Facile</span>
          <span className="text-[10px]">Écoulement</span>
        </div>
        <div className="font-mono text-2xl sm:text-3xl font-semibold text-primary">
          {avgDays} Jours
        </div>
        <div className="text-xs text-accent font-medium mt-1 flex items-center gap-1">
          <span>⚡ Écoulement fluide</span>
        </div>
      </div>
    </section>
  );
};
