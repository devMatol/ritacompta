import React from 'react';
import { Sale } from '../types';

interface SalesTabProps {
  sales: Sale[];
}

export const SalesTab: React.FC<SalesTabProps> = ({ sales }) => {
  return (
    <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
      <div className="flex justify-between items-baseline border-b border-border pb-4 mb-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-primary">Journal des Pièces Vendues</h2>
          <p className="text-xs text-secondary mt-0.5">
            Historique certifié avec calcul de la marge nette (€ et %), du ROI et du délai d'écoulement.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-tertiary">
          {sales.length} Ventes Enregistrées
        </span>
      </div>

      {sales.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">📜</div>
          <h3 className="font-heading text-lg font-bold text-primary mb-1">
            Aucune vente clôturée pour le moment
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Dès que vous vendez une pièce sur Vinted ou sur un marché, enregistrez-la pour voir apparaître vos marges et votre ROI.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-strong bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 w-14">Photo</th>
                <th className="py-2.5 px-3">Pièce Vendue</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Prix Vendu Net</th>
                <th className="py-2.5 px-3">Coût Achat</th>
                <th className="py-2.5 px-3">Marge Nette (€)</th>
                <th className="py-2.5 px-3">ROI (%)</th>
                <th className="py-2.5 px-3">Délai Vente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map(sale => {
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
      )}
    </div>
  );
};
