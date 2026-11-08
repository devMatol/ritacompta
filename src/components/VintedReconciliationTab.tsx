import React, { useState, useMemo } from 'react';
import { Item, Sale, VintedItem } from '../types';
import { isSameVintedItem, isVintedItemImported } from '../services/matching';
import { formatEur } from '../services/format';
import { ExternalLink, Search, RefreshCw, Plus, Package, Sparkles, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface VintedReconciliationTabProps {
  items: Item[];
  sales?: Sale[];
  vintedCatalog: VintedItem[];
  onReloadRealDressing: (force?: boolean) => Promise<any>;
  onBulkImportAll: () => Promise<void>;
  onQuickAddVintedToCompta: (vintedItem: VintedItem) => void;
  onOpenSaleModal?: (item: Item, suggestedPrice?: number, channel?: string) => void;
  onDeleteItem?: (itemId: string) => Promise<void> | void;
}

export const VintedReconciliationTab: React.FC<VintedReconciliationTabProps> = ({
  items,
  sales = [],
  vintedCatalog,
  onReloadRealDressing,
  onBulkImportAll,
  onQuickAddVintedToCompta,
  onOpenSaleModal,
  onDeleteItem
}) => {
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Stock items that are NO LONGER present on Vinted (SOLDS / MISSING on Vinted)
  const soldOrMissingOnVinted = useMemo(() => {
    return items.filter(item => {
      return !vintedCatalog.some(vnt => isSameVintedItem(item, vnt));
    });
  }, [items, vintedCatalog]);

  // 2. Filter ONLY items from Vinted that are NOT yet imported in stock or sales (NEW to import)
  const unimportedItems = useMemo(() => {
    return vintedCatalog.filter(vnt => !isVintedItemImported(vnt, items, sales));
  }, [vintedCatalog, items, sales]);

  // Search filter on unimported items
  const filteredUnimported = useMemo(() => {
    if (!search.trim()) return unimportedItems;
    const q = search.toLowerCase();
    return unimportedItems.filter(v =>
      v.title.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q)
    );
  }, [unimportedItems, search]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await onReloadRealDressing(true);
      const count = Array.isArray(result) ? result.length : vintedCatalog.length;
      setSyncMessage(`Dressing actualisé (${count} pièces)`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (e) {
      setSyncMessage('Erreur lors du reload');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportAll = async () => {
    if (unimportedItems.length === 0) return;
    setIsImporting(true);
    try {
      await onBulkImportAll();
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (item: Item) => {
    const confirmed = window.confirm(
      `Supprimer définitivement "${item.brand} - ${item.title}" du stock ?`
    );
    if (!confirmed) return;

    if (onDeleteItem) {
      try {
        setDeletingId(item.id);
        await onDeleteItem(item.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 card-glossy flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Synchro Vinted
            </h1>

            {soldOrMissingOnVinted.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,138,128,0.15)] text-corail border border-corail/30 font-medium flex items-center gap-1.5">
                <AlertTriangle size={12} />
                <span>{soldOrMissingOnVinted.length} manquant(s)</span>
              </span>
            )}

            {unimportedItems.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,143,192,0.14)] text-accent-pale border border-[rgba(255,143,192,0.25)] font-medium flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>{unimportedItems.length} à importer</span>
              </span>
            )}

            {soldOrMissingOnVinted.length === 0 && unimportedItems.length === 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgba(127,227,181,0.15)] text-menthe border border-menthe/30 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                <span>100% synchronisé</span>
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-1">
            Réconciliation automatique entre le dressing Vinted ({vintedCatalog.length} pièces) et le stock comptable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {syncMessage && (
            <span className="text-xs text-menthe font-medium px-2.5 py-1 rounded-full bg-[rgba(127,227,181,0.12)] border border-menthe/25 animate-fade-in">
              {syncMessage}
            </span>
          )}

          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full btn-secondary-glossy cursor-pointer"
            title="Actualiser en direct depuis Vinted"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-accent" : "text-secondary"} />
            <span>{isSyncing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>

          <button
            onClick={handleImportAll}
            disabled={unimportedItems.length === 0 || isImporting}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-all ${
              unimportedItems.length > 0
                ? 'bg-accent text-[#2B0717] font-semibold hover:brightness-110 active:scale-95 cursor-pointer shadow-xs'
                : 'bg-white/[0.03] border border-[rgba(255,190,220,0.08)] text-tertiary cursor-not-allowed opacity-60'
            }`}
          >
            <Plus size={14} />
            <span>{isImporting ? 'Importation...' : `Tout importer (${unimportedItems.length})`}</span>
          </button>
        </div>
      </div>

      {/* 2. PIÈCES VENDUES OU ABSENTES DE VINTED (Liste compacte avec photo 64px) */}
      {soldOrMissingOnVinted.length > 0 && (
        <div className="p-4 sm:p-5 card-glossy border border-corail/30 space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[rgba(255,190,220,0.07)]">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-corail flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{soldOrMissingOnVinted.length} pièce(s) manquante(s) sur Vinted</span>
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                En stock comptable mais plus trouvées sur le dressing. Enregistrez la vente ou supprimez la pièce.
              </p>
            </div>
          </div>

          {/* Liste compacte (photo 64px, titre, prix, bouton enregistrer vente, supprimer) */}
          <div className="space-y-2.5">
            {soldOrMissingOnVinted.map(item => {
              const cost = item.purchasePrice !== null ? Number(item.purchasePrice) : null;
              const target = Number(item.targetPrice) || 0;
              const margin = cost !== null ? target - cost : null;
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-[rgba(255,190,220,0.10)] hover:border-[rgba(255,190,220,0.20)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Photo 64px + infos */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/10">
                      {item.photo ? (
                        <img src={item.photo} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary">
                          <Package size={20} className="opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-tertiary">#{item.id}</span>
                        {item.size && (
                          <span className="text-[10px] text-secondary px-1.5 py-0.2 rounded-sm bg-white/5">
                            {item.size}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-primary truncate mt-0.5">
                        {item.brand}
                      </h3>
                      <p className="text-xs text-secondary truncate">
                        {item.title}
                      </p>
                      <div className="text-[11px] text-secondary mt-1 flex items-center gap-2">
                        <span>Achat {cost !== null ? formatEur(cost) : '—'}</span>
                        <span>·</span>
                        <span>Cible {formatEur(target)}</span>
                        {margin !== null && (
                          <>
                            <span>·</span>
                            <span className="text-menthe font-medium">Marge {formatEur(margin, true)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {onOpenSaleModal && (
                      <button
                        onClick={() => onOpenSaleModal(item, item.targetPrice, 'Vinted')}
                        disabled={isDeleting}
                        className="px-3.5 py-2 text-xs font-semibold rounded-full bg-accent text-[#2B0717] hover:brightness-110 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        <span>Enregistrer la vente ({formatEur(target)})</span>
                      </button>
                    )}

                    {onDeleteItem && (
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                        className="p-2 text-secondary hover:text-corail rounded-full hover:bg-corail/10 transition-colors"
                        title="Supprimer du stock"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. NOUVELLES PIÈCES EN LIGNE SUR VINTED À IMPORTER (Liste compacte avec photo 64px) */}
      {unimportedItems.length > 0 && (
        <div className="p-4 sm:p-5 card-glossy space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[rgba(255,190,220,0.07)]">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-primary flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span>Nouvelles pièces sur Vinted ({filteredUnimported.length})</span>
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Actives sur @nuzhdina.ri mais pas encore enregistrées dans le stock
              </p>
            </div>

            {unimportedItems.length > 2 && (
              <div className="relative min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                <input
                  type="text"
                  placeholder="Filtrer par marque..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/[0.03] border border-[rgba(255,190,220,0.12)] rounded-full text-primary placeholder:text-tertiary outline-none focus:border-accent-light"
                />
              </div>
            )}
          </div>

          {/* Liste compacte (photo 64px) */}
          <div className="space-y-2.5">
            {filteredUnimported.map(vnt => (
              <div
                key={vnt.id}
                className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-[rgba(255,190,220,0.08)] hover:border-[rgba(255,190,220,0.16)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Photo 64px + infos */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/10">
                    {vnt.photo ? (
                      <img src={vnt.photo} alt={vnt.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary">
                        <Package size={20} className="opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{vnt.brand}</span>
                      {vnt.size && (
                        <span className="text-[10px] text-secondary px-1.5 py-0.2 rounded-sm bg-white/5">
                          {vnt.size}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary truncate mt-0.5">
                      {vnt.title}
                    </p>
                    <div className="text-[11px] text-tertiary mt-1 flex items-center gap-2">
                      <span className="font-semibold text-primary">{formatEur(vnt.price)}</span>
                      {vnt.condition && (
                        <>
                          <span>·</span>
                          <span>{vnt.condition}</span>
                        </>
                      )}
                      {vnt.url && (
                        <>
                          <span>·</span>
                          <a
                            href={vnt.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-light hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Voir sur Vinted</span>
                            <ExternalLink size={10} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Import button */}
                <button
                  onClick={() => onQuickAddVintedToCompta(vnt)}
                  className="self-end sm:self-auto px-3.5 py-1.5 text-xs font-medium rounded-full btn-secondary-glossy flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={13} />
                  <span>Importer</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Complete Synchronized State */}
      {soldOrMissingOnVinted.length === 0 && unimportedItems.length === 0 && (
        <div className="p-8 sm:p-12 card-glossy text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(127,227,181,0.12)] border border-menthe/30 flex items-center justify-center mx-auto mb-3 text-menthe">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-primary mb-1">
            Dressing & Stock synchronisés
          </h2>
          <p className="text-xs text-secondary max-w-md mx-auto mb-4 leading-relaxed">
            Toutes les pièces de votre inventaire correspondent à votre dressing Vinted ({vintedCatalog.length} pièces). Aucune action requise.
          </p>
          <a
            href="https://www.vinted.fr/member/68815764-nuzhdinari"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent-light hover:underline"
          >
            <span>Voir le dressing @nuzhdina.ri sur Vinted</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

    </div>
  );
};
