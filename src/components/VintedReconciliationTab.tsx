import React, { useState, useMemo } from 'react';
import { Item, Sale, VintedItem } from '../types';
import { isSameVintedItem, isVintedItemImported } from '../services/matching';
import { ExternalLink, Search, RefreshCw, CheckCircle2, Plus, Package, Sparkles, AlertTriangle, Trash2 } from 'lucide-react';

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
      setSyncMessage(`Dressing actualisé (${count} pièces en ligne)`);
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
      `Supprimer définitivement "${item.brand} - ${item.title}" du stock ?\n\nCette action retire la pièce de l'inventaire.`
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
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header & Actions Bar */}
      <div className="bg-surface border border-border rounded-md p-4 sm:p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-primary">Vinted Sync & Detection</h2>
            
            {/* Status Pills */}
            {soldOrMissingOnVinted.length > 0 && (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-sm font-bold flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>{soldOrMissingOnVinted.length} manquant(s) / vendu(s)</span>
              </span>
            )}

            {unimportedItems.length > 0 && (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-sm font-bold flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>{unimportedItems.length} à importer</span>
              </span>
            )}

            {soldOrMissingOnVinted.length === 0 && unimportedItems.length === 0 && (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-profit-soft border border-profit/30 text-profit rounded-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Dressing 100% synchronisé</span>
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-1">
            Réconciliation automatique entre le dressing Vinted de Rita ({vintedCatalog.length} pièces) et le stock actif.
          </p>
        </div>

        {/* Action Buttons: Just Reload and Import */}
        <div className="flex flex-wrap items-center gap-2.5">
          {syncMessage && (
            <span className="font-mono text-xs text-profit bg-profit-soft border border-profit/30 px-2.5 py-1 rounded-sm animate-fade-in font-medium">
              {syncMessage}
            </span>
          )}

          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-surface border border-border-strong text-primary hover:bg-surface-subtle active:scale-95 rounded-sm transition-all shadow-xs cursor-pointer"
            title="Actualiser le dressing Vinted en direct"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? 'Actualisation...' : 'Reload'}</span>
          </button>

          <button
            onClick={handleImportAll}
            disabled={unimportedItems.length === 0 || isImporting}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm transition-all ${
              unimportedItems.length > 0
                ? 'bg-accent text-white hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-surface-subtle border border-border text-tertiary opacity-60 cursor-not-allowed'
            }`}
          >
            <Plus size={14} />
            <span>{isImporting ? 'Importation...' : `Import (${unimportedItems.length})`}</span>
          </button>
        </div>
      </div>

      {/* 2. HIGH PRIORITY NOTIFICATION: Sold / Missing Pieces on Vinted */}
      {soldOrMissingOnVinted.length > 0 && (
        <div className="bg-surface border-2 border-amber-500/40 rounded-md p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-baseline gap-2 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="font-heading text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                  {soldOrMissingOnVinted.length} pièce(s) vendue(s) ou retirée(s) de Vinted
                </h3>
              </div>
              <p className="text-xs text-secondary mt-1 max-w-2xl">
                Ces vêtements sont dans votre stock mais n'apparaissent plus sur Vinted. Enregistrez la vente pour comptabiliser votre bénéfice, ou supprimez-les simplement s'ils ne sont plus en stock.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-sm">
              Action requise
            </span>
          </div>

          {/* Cards Grid for Missing / Sold Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {soldOrMissingOnVinted.map(item => {
              const cost = item.purchasePrice !== null ? Number(item.purchasePrice) : null;
              const target = Number(item.targetPrice) || 0;
              const margin = cost !== null ? target - cost : null;
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-surface border border-amber-500/30 hover:border-amber-500/70 rounded-md overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Photo & Badges */}
                  <div className="relative aspect-[4/3] bg-surface-subtle overflow-hidden border-b border-border">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                        <Package size={32} className="opacity-30 mb-1" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">Pas de photo</span>
                      </div>
                    )}

                    {/* Top-left Ref Pill */}
                    <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-semibold bg-canvas/90 backdrop-blur-md text-primary px-2 py-0.5 rounded-sm border border-border shadow-xs">
                      #{item.id}
                    </span>

                    {/* Top-right Size Pill */}
                    {item.size && (
                      <span className="absolute top-2.5 right-2.5 font-mono text-[11px] font-bold bg-surface/95 backdrop-blur-md text-primary px-2 py-0.5 rounded-sm border border-border shadow-xs">
                        {item.size}
                      </span>
                    )}

                    {/* Bottom Status Pill */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-canvas/95 backdrop-blur-md border border-amber-500/40 px-2 py-1 rounded-sm shadow-xs w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                        <span className="truncate">Absent de Vinted</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                    <div>
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h4 className="font-heading font-bold text-base text-primary tracking-tight truncate">
                          {item.brand}
                        </h4>
                        {item.category && (
                          <span className="text-[10px] font-mono uppercase text-tertiary shrink-0">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                        {item.title}
                      </p>
                    </div>

                    {/* Financial Summary Row */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-amber-500/5 border border-amber-500/20 rounded-sm text-center">
                      <div>
                        <div className="text-[9px] uppercase font-mono tracking-wider text-tertiary">Coût</div>
                        <div className="font-mono text-xs font-bold text-primary mt-0.5">
                          {cost !== null ? `${cost} €` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-mono tracking-wider text-tertiary">Prix Vente</div>
                        <div className="font-mono text-xs font-bold text-accent mt-0.5">
                          {target} €
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase font-mono tracking-wider text-tertiary">Marge</div>
                        <div className="font-mono text-xs font-bold text-profit mt-0.5">
                          {margin !== null ? (margin >= 0 ? `+${margin} €` : `${margin} €`) : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Record Sale & Delete */}
                    <div className="space-y-2 pt-1">
                      {onOpenSaleModal && (
                        <button
                          onClick={() => onOpenSaleModal(item, item.targetPrice, 'Vinted')}
                          disabled={isDeleting}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 size={14} />
                          <span>Enregistrer la vente ({target} €)</span>
                        </button>
                      )}

                      {onDeleteItem && (
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-secondary hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-sm active:scale-[0.98] transition-all cursor-pointer"
                          title="Supprimer définitivement cette pièce du stock"
                        >
                          <Trash2 size={13} />
                          <span>{isDeleting ? 'Suppression...' : 'Supprimer du stock'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. NEW VINTED ITEMS: Pending Import into Stock */}
      {unimportedItems.length > 0 && (
        <div className="bg-surface border border-border rounded-md p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span>Nouvelles pièces sur Vinted à importer ({filteredUnimported.length})</span>
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Ces pièces sont actives sur le dressing Vinted mais pas encore enregistrées en comptabilité.
              </p>
            </div>

            {unimportedItems.length > 3 && (
              <div className="relative min-w-[220px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
                <input
                  type="text"
                  placeholder="Filtrer par marque ou titre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-sm outline-none focus:border-accent"
                />
              </div>
            )}
          </div>

          {/* Cards Grid for New Vinted Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUnimported.map(vnt => (
              <div
                key={vnt.id}
                className="bg-surface border border-border hover:border-accent/60 rounded-md overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Photo & Badges */}
                <div className="relative aspect-[4/3] bg-surface-subtle overflow-hidden border-b border-border">
                  {vnt.photo ? (
                    <img
                      src={vnt.photo}
                      alt={vnt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                      <Package size={32} className="opacity-30 mb-1" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Pas de photo</span>
                    </div>
                  )}

                  {/* Top-right Price Pill */}
                  <span className="absolute top-2.5 right-2.5 font-mono text-xs font-bold bg-surface/95 backdrop-blur-md text-primary px-2.5 py-1 rounded-sm border border-border shadow-xs">
                    {vnt.price} €
                  </span>

                  {/* Top-left Size Pill */}
                  {vnt.size && (
                    <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-semibold bg-canvas/90 backdrop-blur-md text-primary px-2 py-0.5 rounded-sm border border-border shadow-xs">
                      {vnt.size}
                    </span>
                  )}

                  {/* Bottom Condition Pill */}
                  {vnt.condition && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="inline-block text-[10px] font-medium text-secondary bg-canvas/90 backdrop-blur-md border border-border px-2 py-0.5 rounded-sm truncate">
                        {vnt.condition}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-primary truncate">
                      {vnt.brand}
                    </h4>
                    <p className="text-xs text-secondary line-clamp-2 leading-relaxed mt-0.5">
                      {vnt.title}
                    </p>
                    {vnt.url && (
                      <a
                        href={vnt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent hover:underline inline-flex items-center gap-1 mt-1.5"
                      >
                        <span>Voir sur Vinted</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => onQuickAddVintedToCompta(vnt)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-primary text-canvas rounded-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Importer ({vnt.price} €)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Complete Synchronized State */}
      {soldOrMissingOnVinted.length === 0 && unimportedItems.length === 0 && (
        <div className="bg-surface border border-border rounded-md py-14 px-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-profit-soft border border-profit/30 flex items-center justify-center mx-auto mb-3 text-profit">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mb-1">
            Dressing & Stock 100% synchronisés
          </h3>
          <p className="text-xs text-secondary max-w-md mx-auto mb-5 leading-relaxed">
            Toutes les pièces de votre inventaire actif correspondent au dressing Vinted. Aucune pièce manquante à enregistrer, et aucune nouvelle pièce en attente d'importation.
          </p>
          <div className="inline-flex items-center gap-2 text-[11px] text-tertiary font-mono bg-surface-subtle border border-border px-3 py-1 rounded-sm">
            <span>Dressing à jour ({vintedCatalog.length} pièces en ligne)</span>
            <span>·</span>
            <a
              href="https://www.vinted.fr/member/68815764-nuzhdinari"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline hover:opacity-80 inline-flex items-center gap-0.5"
            >
              <span>Voir @nuzhdina.ri sur Vinted</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

    </div>
  );
};
