import React, { useState, useMemo } from 'react';
import { Item, Sale, VintedItem } from '../types';
import { isVintedItemImported } from '../services/matching';
import { ExternalLink, Search, RefreshCw, CheckCircle2, Plus, Package, Sparkles } from 'lucide-react';

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
  onQuickAddVintedToCompta
}) => {
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filter ONLY items from Vinted that are NOT yet imported in stock or sales
  const unimportedItems = useMemo(() => {
    return vintedCatalog.filter(vnt => !isVintedItemImported(vnt, items, sales));
  }, [vintedCatalog, items, sales]);

  // Search filter on the unimported items
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
      await onReloadRealDressing();
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
      
      {/* 1. Ultra-clean Header & Actions Bar */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-xl font-bold text-primary">Vinted Sync</h2>
            {unimportedItems.length === 0 ? (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-profit-soft border border-profit/30 text-profit rounded-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Up to date (0 new)</span>
              </span>
            ) : (
              <span className="font-mono text-xs px-2.5 py-0.5 bg-warning-soft border border-warning/40 text-warning rounded-sm font-bold flex items-center gap-1.5">
                <span>{unimportedItems.length} new to import</span>
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Only new or missing pieces from Vinted are displayed. Existing stock is never overwritten.
          </p>
        </div>

        {/* Action Buttons: Just Reload and Import */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-surface border border-border-strong text-primary hover:bg-surface-subtle active:scale-95 rounded-sm transition-all shadow-xs"
            title="Reload Vinted dressing to detect new listings"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? 'Checking...' : 'Reload'}</span>
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

      {/* 2. Content: Empty state or Table of New Pieces */}
      {unimportedItems.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-14 px-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-profit-soft border border-profit/30 flex items-center justify-center mx-auto mb-3 text-profit">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mb-1">
            All Vinted items are already in your inventory
          </h3>
          <p className="text-xs text-secondary max-w-md mx-auto mb-5 leading-relaxed">
            Every piece currently listed on <strong>@nuzhdina.ri</strong> has already been imported into your active stock or recorded sales archive. No duplicates can be re-imported.
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
              <span>View Vinted</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md p-5 shadow-sm space-y-4">
          
          {/* Header of the table */}
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span>New items detected on Vinted ({filteredUnimported.length})</span>
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                These pieces are live on Vinted but missing from your accounting inventory.
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

          {/* Table of new items */}
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
                      <span>{vnt.size || 'M'}</span> · <span className="text-[11px]">{vnt.condition || 'Very Good'}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sm font-bold text-primary">
                      {vnt.price} €
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onQuickAddVintedToCompta(vnt)}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary text-canvas rounded-sm hover:opacity-90 active:scale-95 transition-all shadow-xs"
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

    </div>
  );
};
