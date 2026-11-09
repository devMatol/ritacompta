import React, { useEffect, useState } from 'react';
import { Item, VintedItem } from '../types';
import { formatEur } from '../services/format';
import { smartMatch, isCostSet } from '../services/matching';
import { resolveVintedUrl } from '../services/vintedUrl';
import { X, ExternalLink, Package, CheckCircle2, Edit2, Trash2, Plus, Sparkles, Tag } from 'lucide-react';

export type PieceDetailMode = 'stock' | 'vinted_missing' | 'vinted_unimported';

interface PieceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | VintedItem | null;
  mode: PieceDetailMode;
  vintedCatalog?: VintedItem[];
  onOpenSaleModal?: (item: Item, suggestedPrice?: number, channel?: string) => void;
  onUpdateCost?: (itemId: string, newCost: number | null) => void;
  onDeleteItem?: (itemId: string) => Promise<void> | void;
  onImportVinted?: (vintedItem: VintedItem) => void;
}

export const PieceDetailModal: React.FC<PieceDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  mode,
  vintedCatalog = [],
  onOpenSaleModal,
  onUpdateCost,
  onDeleteItem,
  onImportVinted
}) => {
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [costInput, setCostInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  // Determine if it's a Stock Item or a VintedItem
  const isStockItem = 'category' in item || 'purchaseDate' in item;
  const stockItem = isStockItem ? (item as Item) : null;
  const rawVinted = !isStockItem ? (item as VintedItem) : null;

  // Matching with Vinted catalog if stock item
  const match = stockItem ? smartMatch(stockItem, vintedCatalog) : null;
  const matchedVinted = match?.matched ? match.vintedItem : null;

  // Derived properties
  const title = item.title;
  const brand = item.brand;
  const photo = item.photo;
  const size = item.size || matchedVinted?.size || 'Non précisée';
  const condition = (rawVinted && rawVinted.condition) || matchedVinted?.condition || 'Très bon état';
  const category = (stockItem && stockItem.category) || 'Vintage';
  const source = (stockItem && stockItem.source) || 'Vinted';

  const costSet = stockItem ? isCostSet(stockItem.purchasePrice) : false;
  const cost = stockItem && costSet ? Number(stockItem.purchasePrice) : null;
  const price = stockItem
    ? Number(stockItem.targetPrice) || (costSet ? cost! * 2.5 : 0)
    : Number(rawVinted?.price || 0);
  const margin = cost !== null ? price - cost : null;

  const dateAdded = stockItem?.purchaseDate || rawVinted?.publishedDate || stockItem?.publishedDate || '—';

  // Resolve Vinted Link
  const vintedResolution = resolveVintedUrl(
    {
      url: rawVinted?.url || matchedVinted?.url || undefined,
      vintedId: stockItem?.vintedId || matchedVinted?.id || rawVinted?.id,
      id: item.id,
      brand,
      title
    },
    vintedCatalog
  );

  const handleSaveCost = () => {
    if (!stockItem || !onUpdateCost) return;
    const num = costInput.trim() === '' ? null : parseFloat(costInput.replace(',', '.'));
    onUpdateCost(stockItem.id, isNaN(num as number) ? null : num);
    setIsEditingCost(false);
  };

  const handleDelete = async () => {
    if (!stockItem || !onDeleteItem) return;
    const confirmed = window.confirm(`Supprimer définitivement "${stockItem.brand} - ${stockItem.title}" ?`);
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      await onDeleteItem(stockItem.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#17111A] border border-[rgba(255,190,220,0.14)] rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-fade-in">
        
        {/* Header bar */}
        <div className="p-3.5 sm:p-4 border-b border-[rgba(255,190,220,0.08)] flex items-center justify-between gap-3 bg-white/[0.01]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-secondary">
              #{stockItem ? stockItem.id : `VINTED-${item.id}`}
            </span>

            {matchedVinted || mode === 'vinted_unimported' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-menthe/10 text-menthe border border-menthe/30">
                <span className="w-1.5 h-1.5 rounded-full bg-menthe shrink-0" />
                <span>En ligne sur Vinted</span>
              </span>
            ) : mode === 'vinted_missing' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-corail/15 text-corail border border-corail/30">
                <span>Disparu de Vinted</span>
              </span>
            ) : (
              <span className="text-[11px] text-tertiary px-2 py-0.5 rounded-full bg-white/5">
                Hors Vinted
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:text-primary hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            
            {/* Left: Dominant photo + Ouvrir sur Vinted button */}
            <div className="space-y-3">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40 border border-[rgba(255,190,220,0.12)]">
                {photo ? (
                  <img
                    src={photo}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                    <Package size={36} className="opacity-30 mb-2" />
                    <span className="text-xs text-tertiary">Pas de photo</span>
                  </div>
                )}

                {size && (
                  <span className="absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-primary border border-white/10">
                    {size}
                  </span>
                )}
              </div>

              {/* DIRECT VINTED BUTTON */}
              <a
                href={vintedResolution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-full btn-secondary-glossy inline-flex items-center justify-center gap-2 text-accent-light hover:text-primary transition-all border border-[rgba(255,143,192,0.25)] hover:border-accent"
              >
                <ExternalLink size={14} className="shrink-0" />
                <span>Ouvrir sur Vinted</span>
              </a>
            </div>

            {/* Right: Detailed Product Sheet like on Vinted */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-primary tracking-tight">
                  {brand}
                </h2>
                <p className="text-xs sm:text-sm text-secondary mt-0.5 leading-snug">
                  {title}
                </p>
              </div>

              {/* Price card */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[rgba(255,190,220,0.10)] space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-secondary font-medium">Prix de vente / cible</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary font-sans">
                    {formatEur(price)}
                  </span>
                </div>

                {stockItem && (
                  <div className="pt-2 border-t border-[rgba(255,190,220,0.06)] flex items-center justify-between text-xs">
                    <span className="text-secondary">
                      Coût : {cost !== null ? formatEur(cost) : 'Non défini'}
                    </span>
                    {margin !== null ? (
                      <span className="text-menthe font-semibold">
                        Marge {formatEur(margin, true)}
                      </span>
                    ) : (
                      <span className="text-corail font-medium">
                        À définir
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Vinted Specification Table */}
              <div className="rounded-xl border border-[rgba(255,190,220,0.08)] divide-y divide-[rgba(255,190,220,0.06)] text-xs overflow-hidden">
                <div className="p-2.5 flex items-center justify-between bg-white/[0.01]">
                  <span className="text-secondary">Marque</span>
                  <span className="font-semibold text-primary">{brand}</span>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-secondary">Taille</span>
                  <span className="text-primary font-medium">{size}</span>
                </div>

                <div className="p-2.5 flex items-center justify-between bg-white/[0.01]">
                  <span className="text-secondary">État</span>
                  <span className="text-primary">{condition}</span>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-secondary">Catégorie</span>
                  <span className="text-primary">{category}</span>
                </div>

                {stockItem && (
                  <div className="p-2.5 flex items-center justify-between bg-white/[0.01]">
                    <span className="text-secondary">Source</span>
                    <span className="text-primary">{source}</span>
                  </div>
                )}

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-secondary">Ajout / Publication</span>
                  <span className="text-secondary font-mono">{dateAdded}</span>
                </div>
              </div>

              {/* Inline Edit Cost section if stock item */}
              {stockItem && onUpdateCost && (
                <div className="pt-1">
                  {isEditingCost ? (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-[rgba(255,190,220,0.15)] space-y-2">
                      <label className="text-[11px] text-secondary font-medium block">
                        Modifier le coût d'achat (€)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          autoFocus
                          placeholder="Ex: 15"
                          value={costInput}
                          onChange={e => setCostInput(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white/[0.05] border border-[rgba(255,190,220,0.15)] rounded-lg text-primary outline-none focus:border-accent"
                        />
                        <button
                          onClick={handleSaveCost}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-[#2B0717]"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setIsEditingCost(false)}
                          className="px-2.5 py-1.5 text-xs text-secondary hover:text-primary"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCostInput(cost !== null ? String(cost) : '');
                        setIsEditingCost(true);
                      }}
                      className="text-xs text-accent-light hover:text-accent inline-flex items-center gap-1.5 font-medium py-1"
                    >
                      <Edit2 size={12} />
                      <span>{cost !== null ? "Modifier le coût d'achat" : "Renseigner le coût d'achat"}</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[rgba(255,190,220,0.08)] bg-white/[0.02] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {stockItem && onDeleteItem && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 text-xs font-medium text-secondary hover:text-corail rounded-full hover:bg-corail/10 transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Supprimer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {stockItem && onOpenSaleModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSaleModal(stockItem, price, 'Vinted');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-accent text-[#2B0717] hover:brightness-110 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Enregistrer la vente ({formatEur(price)})</span>
              </button>
            )}

            {rawVinted && onImportVinted && (
              <button
                onClick={() => {
                  onClose();
                  onImportVinted(rawVinted);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-full btn-primary-pink inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                <span>Importer dans le stock</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
