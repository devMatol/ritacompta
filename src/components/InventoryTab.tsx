import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Item, VintedItem } from '../types';
import { smartMatch, isCostSet } from '../services/matching';
import { formatEur } from '../services/format';
import { resolveVintedUrl } from '../services/vintedUrl';
import { PieceDetailModal } from './PieceDetailModal';
import { Search, Package, MoreHorizontal, Check, Edit2, Trash2, ArrowUpDown, ExternalLink } from 'lucide-react';

interface InventoryTabProps {
  items: Item[];
  vintedCatalog: VintedItem[];
  onOpenSaleModal: (item: Item) => void;
  onNavigateAdd: () => void;
  onUpdatePurchasePrice: (itemId: string, newPrice: number | null) => void;
  onDeleteItem?: (itemId: string) => Promise<void> | void;
}

type SortOption = 'newest' | 'brand_asc' | 'price_desc' | 'price_asc' | 'margin_desc' | 'unpriced_first';
type FilterStatus = 'all' | 'unpriced' | 'vinted_matched' | 'not_on_vinted';

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  vintedCatalog,
  onOpenSaleModal,
  onNavigateAdd,
  onUpdatePurchasePrice,
  onDeleteItem
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(items.map(i => i.category)))], [items]);

  // Counts for filter pills
  const unpricedCount = useMemo(() => items.filter(i => !isCostSet(i.purchasePrice)).length, [items]);
  const matchedCount = useMemo(() => items.filter(i => smartMatch(i, vintedCatalog).matched).length, [items, vintedCatalog]);
  const notMatchedCount = items.length - matchedCount;

  // Filter & Sort items
  const processedItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch =
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === 'unpriced') {
        matchesStatus = !isCostSet(item.purchasePrice);
      } else if (statusFilter === 'vinted_matched') {
        matchesStatus = smartMatch(item, vintedCatalog).matched;
      } else if (statusFilter === 'not_on_vinted') {
        matchesStatus = !smartMatch(item, vintedCatalog).matched;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });

    result.sort((a, b) => {
      const aSet = isCostSet(a.purchasePrice);
      const bSet = isCostSet(b.purchasePrice);
      const aCost = aSet ? Number(a.purchasePrice) : 0;
      const bCost = bSet ? Number(b.purchasePrice) : 0;
      const aTarget = Number(a.targetPrice) || (aSet ? aCost * 2.5 : 0);
      const bTarget = Number(b.targetPrice) || (bSet ? bCost * 2.5 : 0);
      const aMargin = aTarget - aCost;
      const bMargin = bTarget - bCost;

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
          if (!aSet && bSet) return -1;
          if (aSet && !bSet) return 1;
          return 0;
        case 'newest':
        default:
          return b.id.localeCompare(a.id);
      }
    });

    return result;
  }, [items, search, selectedCategory, statusFilter, sortBy, vintedCatalog]);

  const handlePromptSetPrice = (item: Item) => {
    setActiveMenuId(null);
    const isSet = isCostSet(item.purchasePrice);
    const initialVal = isSet ? String(item.purchasePrice) : "";
    const p = prompt(
      `Coût d'achat pour "${item.brand} - ${item.title}" (€) :\n• Saisissez 0 si gratuit (dressing personnel)\n• Saisissez le prix en €\n• Laissez vide pour indiquer un coût à définir`,
      initialVal
    );

    if (p === null) return;
    const trimmed = p.trim();

    if (trimmed === "") {
      onUpdatePurchasePrice(item.id, null);
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdatePurchasePrice(item.id, parsed);
      } else {
        alert("Montant invalide. Veuillez entrer un nombre valide ou laisser vide.");
      }
    }
  };

  const handleDelete = async (item: Item) => {
    setActiveMenuId(null);
    if (!onDeleteItem) return;
    const confirmDelete = window.confirm(
      `Supprimer définitivement "${item.brand} - ${item.title}" du stock ?`
    );
    if (confirmDelete) {
      await onDeleteItem(item.id);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* 1. Header Toolbar: Search, Category, Sort, and Filter Pills */}
      <div className="p-4 sm:p-5 card-glossy space-y-3.5">
        
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Rechercher par marque, pièce ou référence..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white/[0.03] border border-[rgba(255,190,220,0.12)] rounded-full text-primary placeholder:text-tertiary outline-none focus:border-accent-light transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-initial py-2 px-3 text-xs bg-white/[0.03] border border-[rgba(255,190,220,0.12)] rounded-full text-primary outline-none focus:border-accent-light cursor-pointer"
            >
              <option value="ALL" className="bg-[#17111A]">Toutes catégories</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat} className="bg-[#17111A]">{cat}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full py-2 pl-3 pr-7 text-xs bg-white/[0.03] border border-[rgba(255,190,220,0.12)] rounded-full text-primary outline-none focus:border-accent-light cursor-pointer appearance-none"
              >
                <option value="newest" className="bg-[#17111A]">Plus récents</option>
                <option value="brand_asc" className="bg-[#17111A]">Marque (A - Z)</option>
                <option value="price_desc" className="bg-[#17111A]">Prix cible décroissant</option>
                <option value="price_asc" className="bg-[#17111A]">Prix cible croissant</option>
                <option value="margin_desc" className="bg-[#17111A]">Marge décroissante</option>
                <option value="unpriced_first" className="bg-[#17111A]">Coût à définir en premier</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[rgba(255,190,220,0.07)] text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
              statusFilter === 'all'
                ? 'bg-[rgba(255,143,192,0.18)] text-accent-pale shadow-xs'
                : 'text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
          >
            Tous ({items.length})
          </button>

          <button
            onClick={() => setStatusFilter('unpriced')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
              statusFilter === 'unpriced'
                ? 'bg-[rgba(255,138,128,0.18)] text-corail shadow-xs'
                : 'text-secondary hover:text-corail hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-corail shrink-0" />
            <span>Coût manquant ({unpricedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('vinted_matched')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
              statusFilter === 'vinted_matched'
                ? 'bg-[rgba(127,227,181,0.18)] text-menthe shadow-xs'
                : 'text-secondary hover:text-menthe hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-menthe shrink-0" />
            <span>Sur Vinted ({matchedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('not_on_vinted')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
              statusFilter === 'not_on_vinted'
                ? 'bg-white/[0.10] text-primary shadow-xs'
                : 'text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
          >
            Hors Vinted ({notMatchedCount})
          </button>
        </div>

      </div>

      {/* 2. Cards Grid (2 colonnes sur mobile, 3 à 4 sur grand écran) */}
      {items.length === 0 ? (
        <div className="p-10 card-glossy text-center">
          <Package size={40} className="mx-auto mb-2 text-secondary opacity-40" />
          <h2 className="text-base font-semibold text-primary mb-1">
            Votre stock est vide
          </h2>
          <p className="text-xs text-secondary max-w-sm mx-auto mb-4">
            Enregistrez votre premier achat ou synchronisez votre dressing Vinted.
          </p>
          <button
            onClick={onNavigateAdd}
            className="px-4 py-2 text-xs font-semibold rounded-full btn-primary-pink inline-flex items-center gap-1.5"
          >
            + Enregistrer une pièce
          </button>
        </div>
      ) : processedItems.length === 0 ? (
        <div className="p-8 card-glossy text-center text-xs text-secondary">
          Aucune pièce ne correspond à votre recherche ou filtre.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {processedItems.map(item => {
            const costSet = isCostSet(item.purchasePrice);
            const cost = costSet ? Number(item.purchasePrice) : null;
            const target = Number(item.targetPrice) || (costSet ? cost! * 2.5 : 0);
            const margin = costSet ? target - cost! : null;
            const match = smartMatch(item, vintedCatalog);
            const isMenuOpen = activeMenuId === item.id;

            return (
              <div
                key={item.id}
                className="card-glossy overflow-hidden flex flex-col justify-between group relative transition-all hover:border-[rgba(255,190,220,0.22)]"
              >
                {/* Photo 4:5 cliquable ouvrant la fiche Vinted */}
                <div
                  onClick={() => setSelectedItemForDetail(item)}
                  className="relative aspect-[4/5] bg-black/40 overflow-hidden cursor-pointer"
                >
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                      <Package size={28} className="opacity-30 mb-1" />
                      <span className="text-[10px] text-tertiary">Pas de photo</span>
                    </div>
                  )}

                  {/* Badge Référence haut gauche (monospace) */}
                  <span className="absolute top-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-black/75 backdrop-blur-md text-secondary border border-white/10">
                    #{item.id}
                  </span>

                  {/* Badge Taille haut droite */}
                  {item.size && (
                    <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-black/75 backdrop-blur-md text-primary border border-white/10">
                      {item.size}
                    </span>
                  )}

                  {/* Badge Statut Vinted bas de photo */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    {match.matched ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-menthe border border-menthe/30 shadow-xs truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-menthe shrink-0" />
                        <span className="truncate">En ligne ({formatEur(match.vintedItem?.price)})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-secondary px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-xs">
                        Hors Vinted
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body cliquable ouvrant la fiche */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div
                    onClick={() => setSelectedItemForDetail(item)}
                    className="cursor-pointer"
                  >
                    {/* Marque (600) */}
                    <h2 className="text-xs sm:text-sm font-semibold text-primary truncate hover:text-accent-light transition-colors">
                      {item.brand}
                    </h2>

                    {/* Titre (secondaire, 2 lignes max) */}
                    <p className="text-[11px] sm:text-xs text-secondary line-clamp-2 leading-snug mt-0.5">
                      {item.title}
                    </p>

                    {/* Ligne Cible · Marge en menthe */}
                    <div className="text-[11px] sm:text-xs text-secondary mt-2 flex items-center gap-1.5 flex-wrap">
                      <span>Cible {formatEur(target)}</span>
                      <span>·</span>
                      {margin !== null ? (
                        <span className="text-menthe font-medium">
                          marge {formatEur(margin, true)}
                        </span>
                      ) : (
                        <span className="text-corail font-medium">
                          coût manquant
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row : Bouton "Vendu" + Menu "⋯" */}
                  <div className="mt-3 pt-2.5 border-t border-[rgba(255,190,220,0.07)] flex items-center gap-1.5 relative">
                    <button
                      onClick={() => onOpenSaleModal(item)}
                      className="flex-1 py-1.5 px-3 text-xs rounded-full bg-white/[0.04] border border-[rgba(255,143,192,0.30)] text-accent-pale hover:bg-[rgba(255,143,192,0.14)] active:scale-95 transition-all font-medium text-center"
                    >
                      Vendu
                    </button>

                    {/* Menu "⋯" */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : item.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-white/[0.06] transition-all"
                        aria-label="Plus d'actions"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 bottom-full mb-1 z-30 w-48 rounded-xl bg-[#17111A] border border-[rgba(255,190,220,0.14)] shadow-xl p-1 text-xs space-y-0.5 animate-fade-in"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setSelectedItemForDetail(item);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-md flex items-center gap-2 text-left text-secondary hover:text-primary hover:bg-white/[0.06] transition-colors"
                          >
                            <Package size={13} className="text-accent-pale" />
                            <span>Voir la fiche</span>
                          </button>

                          <a
                            href={resolveVintedUrl(
                              {
                                url: match.vintedItem?.url,
                                vintedId: item.vintedId || match.vintedItem?.id,
                                id: item.id,
                                brand: item.brand,
                                title: item.title
                              },
                              vintedCatalog
                            ).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveMenuId(null)}
                            className="w-full px-2.5 py-1.5 rounded-md flex items-center gap-2 text-left text-accent-light hover:text-primary hover:bg-white/[0.06] transition-colors"
                          >
                            <ExternalLink size={13} />
                            <span>Ouvrir sur Vinted</span>
                          </a>

                          <button
                            onClick={() => handlePromptSetPrice(item)}
                            className="w-full px-2.5 py-1.5 rounded-md flex items-center gap-2 text-left text-secondary hover:text-primary hover:bg-white/[0.06] transition-colors"
                          >
                            <Edit2 size={13} className="text-accent" />
                            <span>{costSet ? `Modifier coût (${formatEur(cost)})` : 'Définir le coût'}</span>
                          </button>

                          {onDeleteItem && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="w-full px-2.5 py-1.5 rounded-md flex items-center gap-2 text-left text-corail hover:bg-corail/10 transition-colors"
                            >
                              <Trash2 size={13} />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Fiche Détaillée Style Vinted */}
      <PieceDetailModal
        isOpen={Boolean(selectedItemForDetail)}
        onClose={() => setSelectedItemForDetail(null)}
        item={selectedItemForDetail}
        mode="stock"
        vintedCatalog={vintedCatalog}
        onOpenSaleModal={onOpenSaleModal}
        onUpdateCost={onUpdatePurchasePrice}
        onDeleteItem={onDeleteItem}
      />

    </div>
  );
};
