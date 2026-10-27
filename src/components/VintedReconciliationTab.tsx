import React, { useState, useMemo } from 'react';
import { Item, Sale, VintedItem } from '../types';
import { isSameVintedItem, isVintedItemImported } from '../services/matching';
import { ExternalLink, Search, RefreshCw, CheckCircle2, Plus, Package, Sparkles, AlertTriangle } from 'lucide-react';

interface VintedReconciliationTabProps {
  items: Item[];
  sales?: Sale[];
  vintedCatalog: VintedItem[];
  onReloadRealDressing: () => Promise<any>;
  onBulkImportAll: () => Promise<void>;
  onQuickAddVintedToCompta: (vintedItem: VintedItem) => void;
  onOpenSaleModal?: (item: Item, suggestedPrice?: number, channel?: string) => void;
}

export const VintedReconciliationTab: React.FC<VintedReconciliationTabProps> = ({
  items,
  sales = [],
  vintedCatalog,
  onReloadRealDressing,
  onBulkImportAll,
  onQuickAddVintedToCompta,
  onOpenSaleModal
}) => {
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
    try {
      const result = await onReloadRealDressing();
      const count = Array.isArray(result) ? result.length : vintedCatalog.length;
      console.log(`Vinted dressing reloaded: ${count} items.`);
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header & Actions Bar */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-heading text-xl font-bold text-primary">Vinted Sync & Detection</h2>
            
            {/* Status Pills */}
            {soldOrMissingOnVinted.length > 0 && (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-sm font-bold flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>{soldOrMissingOnVinted.length} sold / missing on Vinted</span>
              </span>
            )}

            {unimportedItems.length > 0 && (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-sm font-bold flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>{unimportedItems.length} new to import</span>
              </span>
            )}

            {soldOrMissingOnVinted.length === 0 && unimportedItems.length === 0 && (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-profit-soft border border-profit/30 text-profit rounded-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Dressing 100% in sync</span>
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-1">
            Automatic reconciliation between Rita's live Vinted dressing ({vintedCatalog.length} pieces) and active stock.
          </p>
        </div>

        {/* Action Buttons: Just Reload and Import */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-surface border border-border-strong text-primary hover:bg-surface-subtle active:scale-95 rounded-sm transition-all shadow-xs cursor-pointer"
            title="Reload live Vinted dressing to detect sales and new listings"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? 'Reloading...' : 'Reload'}</span>
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
            <span>{isImporting ? 'Importing...' : `Import (${unimportedItems.length})`}</span>
          </button>
        </div>
      </div>

      {/* 2. HIGH PRIORITY NOTIFICATION: Sold / Missing Pieces on Vinted */}
      {soldOrMissingOnVinted.length > 0 && (
        <div className="bg-surface border-2 border-amber-500/40 rounded-md p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-baseline gap-2 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="font-heading text-lg font-bold text-amber-600 dark:text-amber-400">
                  {soldOrMissingOnVinted.length} Stock Item(s) Sold / Missing on Vinted
                </h3>
              </div>
              <p className="text-xs text-secondary mt-1">
                These pieces are present in your accounting stock but no longer found on Vinted. Click <strong>« Record Sale »</strong> to move them to your sales compta and book the profit in 1 click.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-sm">
              Action Required
            </span>
          </div>

          <div className="overflow-x-auto border border-border rounded-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-amber-500/5 text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <th className="py-2.5 px-3 w-14">Photo</th>
                  <th className="py-2.5 px-3">Ref & Brand</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Cost Price</th>
                  <th className="py-2.5 px-3">Target Price</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {soldOrMissingOnVinted.map(item => (
                  <tr key={item.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-2.5 px-3">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-sm border border-border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-sm bg-surface-subtle flex items-center justify-center text-secondary border border-border">
                          <Package size={16} />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] text-tertiary">#{item.id}</span>
                      <div className="font-heading font-bold text-sm text-primary">{item.brand}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-secondary">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs font-bold text-primary">
                      {item.purchasePrice !== null ? `${item.purchasePrice} €` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sm font-bold text-accent">
                      {item.targetPrice} €
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {onOpenSaleModal && (
                        <button
                          onClick={() => onOpenSaleModal(item, item.targetPrice, 'Vinted')}
                          className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          <span>Record Sale ({item.targetPrice} €)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. NEW VINTED ITEMS: Pending Import into Stock */}
      {unimportedItems.length > 0 && (
        <div className="bg-surface border border-border rounded-md p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span>New pieces live on Vinted to import ({filteredUnimported.length})</span>
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                These pieces are active on @nuzhdina.ri but not yet registered in your stock.
              </p>
            </div>

            {unimportedItems.length > 3 && (
              <div className="relative min-w-[200px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
                <input
                  type="text"
                  placeholder="Filter by brand or title..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-surface border border-border rounded-sm outline-none focus:border-accent"
                />
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-border rounded-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <th className="py-2.5 px-3 w-14">Photo</th>
                  <th className="py-2.5 px-3">Item Title</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Size & Condition</th>
                  <th className="py-2.5 px-3">Vinted Price</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUnimported.map(vnt => (
                  <tr key={vnt.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-2.5 px-3">
                      {vnt.photo ? (
                        <img
                          src={vnt.photo}
                          alt={vnt.title}
                          className="w-12 h-12 object-cover rounded-sm border border-border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-sm bg-surface-subtle flex items-center justify-center text-secondary border border-border">
                          <Package size={16} />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-heading font-bold text-sm text-primary">{vnt.title}</div>
                      {vnt.url && (
                        <a
                          href={vnt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-accent hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <span>View on Vinted</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-xs text-primary">
                      {vnt.brand}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-secondary">
                      <span>{vnt.size || 'M'}</span> · <span className="text-[11px]">{vnt.condition || 'Très bon état'}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sm font-bold text-primary">
                      {vnt.price} €
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onQuickAddVintedToCompta(vnt)}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary text-canvas rounded-sm hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        + Import
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Dressing & Stock 100% in sync
          </h3>
          <p className="text-xs text-secondary max-w-md mx-auto mb-5 leading-relaxed">
            All pieces in your active inventory correspond to your live Vinted wardrobe. No missing sold pieces to record, and no new pieces pending import.
          </p>
          <div className="inline-flex items-center gap-2 text-[11px] text-tertiary font-mono bg-surface-subtle border border-border px-3 py-1 rounded-sm">
            <span>Dressing synced ({vintedCatalog.length} pieces verified)</span>
            <span>·</span>
            <a
              href="https://www.vinted.fr/member/68815764-nuzhdinari"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline hover:opacity-80 inline-flex items-center gap-0.5"
            >
              <span>View @nuzhdina.ri on Vinted</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

    </div>
  );
};
