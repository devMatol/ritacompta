import React, { useState } from 'react';
import { Item, VintedItem } from '../types';
import { smartMatch } from '../services/matching';
import { Search, Plus } from 'lucide-react';

interface InventoryTabProps {
  items: Item[];
  vintedCatalog: VintedItem[];
  onOpenSaleModal: (item: Item) => void;
  onNavigateAdd: () => void;
  onUpdatePurchasePrice: (itemId: string, newPrice: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  vintedCatalog,
  onOpenSaleModal,
  onNavigateAdd,
  onUpdatePurchasePrice
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-border pb-4 mb-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-primary">Pièces en Stock Actif</h2>
          <p className="text-xs text-secondary mt-0.5">
            Chaque pièce est analysée en temps réel par le moteur intelligent de rapprochement Vinted.
          </p>
        </div>
        <button
          onClick={onNavigateAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-canvas rounded-sm hover:opacity-90 transition-all"
        >
          <Plus size={14} />
          <span>Acheter une pièce</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">🧥</div>
          <h3 className="font-heading text-lg font-bold text-primary mb-1">
            Votre inventaire est vide
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto mb-5">
            Aucun vêtement en stock. Enregistrez votre premier achat avec photo ou importez vos articles Vinted réels.
          </p>
          <button
            onClick={onNavigateAdd}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 transition-all"
          >
            + Enregistrer un vêtement
          </button>
        </div>
      ) : (
        <>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
              <input
                type="text"
                placeholder="Rechercher par marque ou modèle..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'Toutes les Catégories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-strong bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <th className="py-2.5 px-3 w-14">Photo</th>
                  <th className="py-2.5 px-3">Réf.</th>
                  <th className="py-2.5 px-3">Pièce & Marque</th>
                  <th className="py-2.5 px-3">Taille</th>
                  <th className="py-2.5 px-3">Coût Achat</th>
                  <th className="py-2.5 px-3">Cote Cible</th>
                  <th className="py-2.5 px-3">Marge Potentielle</th>
                  <th className="py-2.5 px-3">Statut Vinted</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map(item => {
                  const potentialMargin = (item.targetPrice || item.purchasePrice * 2.5) - item.purchasePrice;
                  const match = smartMatch(item, vintedCatalog);

                  return (
                    <tr key={item.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-3 px-3">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.title}
                            className="w-11 h-11 object-cover rounded-sm border border-border"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-sm bg-surface-subtle border border-dashed border-border-strong flex items-center justify-center text-sm">
                            🧥
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-tertiary">
                        {item.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-heading font-bold text-sm text-primary">{item.brand}</div>
                        <div className="text-xs text-secondary">{item.title} · {item.category}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-medium">
                        {item.size}
                      </td>
                      <td className="py-3 px-3">
                        {item.purchasePrice > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">{item.purchasePrice} €</span>
                            <button
                              onClick={() => {
                                const p = prompt(`Modifier le prix d'achat pour ${item.title} (€) :`, String(item.purchasePrice));
                                if (p !== null && !isNaN(parseFloat(p))) onUpdatePurchasePrice(item.id, parseFloat(p));
                              }}
                              className="text-[10px] text-tertiary hover:text-accent hover:underline"
                            >
                              éditer
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const p = prompt(`Quel est votre prix d'achat réel pour "${item.title}" (€) ?`);
                              if (p !== null && !isNaN(parseFloat(p))) onUpdatePurchasePrice(item.id, parseFloat(p));
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning-soft border border-warning/30 px-2 py-0.5 rounded-sm hover:brightness-95 transition-all"
                          >
                            ⚠️ Saisir prix payé
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-secondary">
                        {item.targetPrice || '-'} €
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold">
                        {item.purchasePrice > 0 ? (
                          <span className="text-profit">+{potentialMargin} €</span>
                        ) : (
                          <span className="text-tertiary text-[11px] italic font-normal">Coût requis</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {match.matched ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-profit bg-profit-soft border border-profit/25 px-2 py-0.5 rounded-sm whitespace-nowrap"
                            title={`Lié à l'annonce Vinted : ${match.vintedItem?.title}`}
                          >
                            ✓ En ligne Vinted ({match.vintedItem?.price} €)
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning-soft border border-warning/30 px-2 py-0.5 rounded-sm whitespace-nowrap"
                            title="Aucune annonce correspondante trouvée sur le profil Vinted"
                          >
                            ⚠️ Manquante sur Vinted
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenSaleModal(item)}
                          className="px-2.5 py-1 text-xs font-semibold bg-accent text-white rounded-sm hover:brightness-110 transition-all"
                        >
                          Vendre
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
