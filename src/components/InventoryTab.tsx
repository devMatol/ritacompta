import React, { useState, useMemo } from 'react';
import { Item, VintedItem } from '../types';
import { smartMatch } from '../services/matching';
import { Search, Plus, Package, ArrowUpDown, LayoutGrid, List, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InventoryTabProps {
  items: Item[];
  vintedCatalog: VintedItem[];
  onOpenSaleModal: (item: Item) => void;
  onNavigateAdd: () => void;
  onUpdatePurchasePrice: (itemId: string, newPrice: number) => void;
}

type SortOption = 'newest' | 'brand_asc' | 'price_desc' | 'price_asc' | 'margin_desc' | 'unpriced_first';
type FilterStatus = 'all' | 'unpriced' | 'vinted_matched' | 'not_on_vinted';

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  vintedCatalog,
  onOpenSaleModal,
  onNavigateAdd,
  onUpdatePurchasePrice
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(items.map(i => i.category)))], [items]);

  // Counts for filter pills
  const unpricedCount = useMemo(() => items.filter(i => Number(i.purchasePrice) === 0).length, [items]);
  const matchedCount = useMemo(() => items.filter(i => smartMatch(i, vintedCatalog).matched).length, [items, vintedCatalog]);
  const notMatchedCount = items.length - matchedCount;

  // Filter & Sort items
  const processedItems = useMemo(() => {
    let result = items.filter(item => {
      // 1. Search filter
      const matchesSearch =
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());

      // 2. Category filter
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

      // 3. Status filter
      let matchesStatus = true;
      if (statusFilter === 'unpriced') {
        matchesStatus = Number(item.purchasePrice) === 0;
      } else if (statusFilter === 'vinted_matched') {
        matchesStatus = smartMatch(item, vintedCatalog).matched;
      } else if (statusFilter === 'not_on_vinted') {
        matchesStatus = !smartMatch(item, vintedCatalog).matched;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });

    // Sort logic
    result.sort((a, b) => {
      const aTarget = Number(a.targetPrice) || (Number(a.purchasePrice) * 2.5);
      const bTarget = Number(b.targetPrice) || (Number(b.purchasePrice) * 2.5);
      const aMargin = aTarget - Number(a.purchasePrice);
      const bMargin = bTarget - Number(b.purchasePrice);

      switch (sortBy) {
        case 'brand_asc':
          return a.brand.localeCompare(b.brand);
        case 'price_desc':
          return bTarget - aTarget;
        case 'price_asc':
          return aTarget - bTarget;
        case 'margin_desc':
          return bMargin - aMargin;
        case 'unpriced_first':
          if (a.purchasePrice === 0 && b.purchasePrice !== 0) return -1;
          if (a.purchasePrice !== 0 && b.purchasePrice === 0) return 1;
          return 0;
        case 'newest':
        default:
          return b.id.localeCompare(a.id);
      }
    });

    return result;
  }, [items, search, selectedCategory, statusFilter, sortBy, vintedCatalog]);

  const handlePromptSetPrice = (item: Item) => {
    const promptMsg = item.purchasePrice > 0
      ? `Edit purchase cost for ${item.brand} - ${item.title} (€):`
      : `Enter your actual purchase cost for "${item.brand} - ${item.title}" (€):`;
    const initialVal = item.purchasePrice > 0 ? String(item.purchasePrice) : "0";
    const p = prompt(promptMsg, initialVal);
    if (p !== null && !isNaN(parseFloat(p))) {
      onUpdatePurchasePrice(item.id, parseFloat(p));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* 1. Header Bar */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-xl font-bold text-primary">Active Inventory</h2>
            <span className="font-mono text-xs px-2 py-0.5 bg-surface-subtle border border-border text-secondary rounded-sm font-semibold">
              {processedItems.length} of {items.length} items
            </span>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Individual piece accounting and real-time Vinted matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center border border-border rounded-sm overflow-hidden bg-surface-subtle p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-xs transition-all ${
                viewMode === 'cards' ? 'bg-surface text-accent shadow-xs' : 'text-secondary hover:text-primary'
              }`}
              title="Cards view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xs transition-all ${
                viewMode === 'table' ? 'bg-surface text-accent shadow-xs' : 'text-secondary hover:text-primary'
              }`}
              title="Table view"
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={onNavigateAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-primary text-canvas rounded-sm hover:opacity-90 shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Add Purchase</span>
          </button>
        </div>
      </div>

      {/* 2. Search, Filter & Sort Controls */}
      <div className="bg-surface border border-border rounded-md p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search bar */}
          <div className="relative sm:col-span-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Search by brand, item title, or #ref..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-surface-subtle border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full py-2 pl-3 pr-8 text-xs bg-surface-subtle border border-border-strong rounded-sm outline-none focus:border-accent appearance-none font-medium"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="brand_asc">Sort: Brand (A - Z)</option>
                <option value="price_desc">Sort: Price (High - Low)</option>
                <option value="price_asc">Sort: Price (Low - High)</option>
                <option value="margin_desc">Sort: Margin (High - Low)</option>
                <option value="unpriced_first">Sort: Unpriced First</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-[11px] font-mono text-tertiary uppercase mr-1">Filter:</span>
          
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-sm transition-all font-medium ${
              statusFilter === 'all'
                ? 'bg-primary text-canvas font-bold'
                : 'bg-surface-subtle border border-border text-secondary hover:text-primary'
            }`}
          >
            All ({items.length})
          </button>

          <button
            onClick={() => setStatusFilter('unpriced')}
            className={`px-2.5 py-1 text-xs rounded-sm transition-all font-medium flex items-center gap-1.5 ${
              statusFilter === 'unpriced'
                ? 'bg-warning text-canvas font-bold'
                : 'bg-surface-subtle border border-border text-secondary hover:border-warning'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
            <span>Needs Cost Price ({unpricedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('vinted_matched')}
            className={`px-2.5 py-1 text-xs rounded-sm transition-all font-medium flex items-center gap-1.5 ${
              statusFilter === 'vinted_matched'
                ? 'bg-profit text-canvas font-bold'
                : 'bg-surface-subtle border border-border text-secondary hover:border-profit'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-profit"></span>
            <span>Listed on Vinted ({matchedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('not_on_vinted')}
            className={`px-2.5 py-1 text-xs rounded-sm transition-all font-medium flex items-center gap-1.5 ${
              statusFilter === 'not_on_vinted'
                ? 'bg-surface-elevated text-primary border border-border-strong font-bold'
                : 'bg-surface-subtle border border-border text-secondary hover:text-primary'
            }`}
          >
            <span>Not on Vinted ({notMatchedCount})</span>
          </button>
        </div>
      </div>

      {/* 3. Empty State or Products Content */}
      {items.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-16 px-6 text-center shadow-sm">
          <Package size={44} className="mx-auto mb-3 text-secondary opacity-50" />
          <h3 className="font-heading text-lg font-bold text-primary mb-1">
            Your inventory is empty
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto mb-6">
            No items in stock. Record your first purchase with photo or import your verified Vinted wardrobe.
          </p>
          <button
            onClick={onNavigateAdd}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 shadow-sm transition-all"
          >
            + Record an Item
          </button>
        </div>
      ) : processedItems.length === 0 ? (
        <div className="bg-surface border border-border rounded-md py-12 px-6 text-center text-xs text-secondary shadow-sm">
          No items match your active search or filters.
        </div>
      ) : viewMode === 'cards' ? (
        
        /* 4. CARDS GRID VIEW (Responsive: 1 col mobile, 2 col tablet, 3-4 col desktop) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {processedItems.map(item => {
            const target = Number(item.targetPrice) || (Number(item.purchasePrice) * 2.5);
            const cost = Number(item.purchasePrice) || 0;
            const potentialMargin = target - cost;
            const match = smartMatch(item, vintedCatalog);

            return (
              <div
                key={item.id}
                className="bg-surface border border-border hover:border-accent/60 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Photo & Overlay Badges */}
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
                      <span className="text-[10px] font-mono uppercase tracking-wider">No photo</span>
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

                  {/* Bottom Vinted Match Banner over photo */}
                  <div className="absolute bottom-2 left-2 right-2">
                    {match.matched ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-profit bg-canvas/95 backdrop-blur-md border border-profit/30 px-2 py-1 rounded-sm shadow-sm w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-profit shrink-0"></span>
                        <span className="truncate">Listed on Vinted · {match.vintedItem?.price} €</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-warning bg-canvas/95 backdrop-blur-md border border-warning/30 px-2 py-1 rounded-sm shadow-sm w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"></span>
                        <span>Not on Vinted</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-heading font-bold text-base text-primary tracking-tight truncate">
                        {item.brand}
                      </h3>
                      <span className="text-[10px] font-mono uppercase text-tertiary shrink-0">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-secondary line-clamp-2 leading-relaxed mb-3.5">
                      {item.title}
                    </p>

                    {/* Financial Block (Clean 3-column pill) */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-surface-subtle border border-border rounded-sm mb-4 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-mono tracking-wider text-tertiary">Cost</div>
                        {cost > 0 ? (
                          <div className="font-mono text-xs font-bold text-primary">{cost} €</div>
                        ) : (
                          <button
                            onClick={() => handlePromptSetPrice(item)}
                            className="text-[10px] font-bold text-warning underline block mx-auto hover:text-primary"
                          >
                            Set cost
                          </button>
                        )}
                      </div>

                      <div className="border-x border-border">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-tertiary">Target</div>
                        <div className="font-mono text-xs font-semibold text-secondary">
                          {target || '-'} €
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-mono tracking-wider text-tertiary">Margin</div>
                        {cost > 0 ? (
                          <div className="font-mono text-xs font-bold text-profit">+{potentialMargin} €</div>
                        ) : (
                          <div className="font-mono text-[10px] text-tertiary italic">-</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handlePromptSetPrice(item)}
                      className="flex-1 py-2 text-xs font-semibold bg-surface border border-border-strong hover:border-accent text-secondary hover:text-primary rounded-sm transition-all"
                    >
                      {cost > 0 ? 'Edit Cost' : 'Set Cost'}
                    </button>

                    <button
                      onClick={() => onOpenSaleModal(item)}
                      className="flex-1 py-2 text-xs font-bold uppercase tracking-wider bg-accent text-white hover:brightness-110 rounded-sm shadow-sm transition-all"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* 5. ALTERNATIVE DENSE TABLE VIEW (For wide desktop screens) */
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-strong bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <th className="py-2.5 px-3 w-14">Photo</th>
                  <th className="py-2.5 px-3">Ref.</th>
                  <th className="py-2.5 px-3">Item & Brand</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Cost Price</th>
                  <th className="py-2.5 px-3">Target Price</th>
                  <th className="py-2.5 px-3">Est. Margin</th>
                  <th className="py-2.5 px-3">Vinted Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processedItems.map(item => {
                  const target = Number(item.targetPrice) || (Number(item.purchasePrice) * 2.5);
                  const cost = Number(item.purchasePrice) || 0;
                  const potentialMargin = target - cost;
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
                          <div className="w-11 h-11 rounded-sm bg-surface-subtle border border-dashed border-border flex items-center justify-center text-secondary">
                            <Package size={16} />
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
                        {cost > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">{cost} €</span>
                            <button
                              onClick={() => handlePromptSetPrice(item)}
                              className="text-[10px] text-tertiary hover:text-accent hover:underline"
                            >
                              edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePromptSetPrice(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning-soft border border-warning/30 px-2 py-0.5 rounded-sm hover:brightness-95 transition-all"
                          >
                            Set cost price
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-secondary">
                        {target || '-'} €
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold">
                        {cost > 0 ? (
                          <span className="text-profit">+{potentialMargin} €</span>
                        ) : (
                          <span className="text-tertiary text-[11px] italic font-normal">Cost needed</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {match.matched ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-profit bg-profit-soft border border-profit/25 px-2 py-0.5 rounded-sm whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-profit"></span>
                            <span>Listed on Vinted ({match.vintedItem?.price} €)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-warning bg-warning-soft border border-warning/30 px-2 py-0.5 rounded-sm whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                            <span>Not on Vinted</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenSaleModal(item)}
                          className="px-2.5 py-1 text-xs font-semibold bg-accent text-white rounded-sm hover:brightness-110 transition-all"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
