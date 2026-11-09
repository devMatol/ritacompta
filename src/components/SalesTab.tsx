import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Item, VintedItem } from '../types';
import { formatEur, formatDays } from '../services/format';
import { resolveVintedUrl } from '../services/vintedUrl';
import { Package, Search, Filter, ArrowLeft, ExternalLink, Calendar, Tag, ShieldCheck, ChevronRight } from 'lucide-react';

interface SalesTabProps {
  sales: Sale[];
  items?: Item[];
  vintedCatalog?: VintedItem[];
}

export const SalesTab: React.FC<SalesTabProps> = ({
  sales,
  items = [],
  vintedCatalog = []
}) => {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'Vinted' | 'Flea Market' | 'Direct'>('ALL');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Keyboard Escape listener to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedSale) {
        setSelectedSale(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSale]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        (s.itemId && s.itemId.toLowerCase().includes(q));

      const matchesChannel =
        channelFilter === 'ALL' ||
        (channelFilter === 'Vinted' && s.channel === 'Vinted') ||
        (channelFilter === 'Flea Market' && s.channel === 'Flea Market') ||
        (channelFilter === 'Direct' && s.channel === 'Direct');

      return matchesSearch && matchesChannel;
    });
  }, [sales, search, channelFilter]);

  // If a sale is selected, render the dedicated full-page view
  if (selectedSale) {
    const margin = selectedSale.salePrice - Number(selectedSale.purchasePrice || 0);
    const cost = Number(selectedSale.purchasePrice || 0);
    const marginRate = cost > 0 ? ((margin / cost) * 100).toFixed(0) : null;
    const pDate = selectedSale.purchaseDate || selectedSale.publishedDate;
    const days = pDate
      ? Math.max(1, Math.round((new Date(selectedSale.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    // URSSAF auto-entrepreneur estimation (12.3%)
    const urssafTax = selectedSale.salePrice * 0.123;
    const netAfterUrssaf = selectedSale.salePrice - urssafTax;

    // Resolve Vinted Link for this sale
    const vintedResolution = resolveVintedUrl(
      {
        itemId: selectedSale.itemId,
        id: selectedSale.id,
        brand: selectedSale.brand,
        title: selectedSale.title
      },
      vintedCatalog
    );

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Top Back Navigation Bar */}
        <div className="p-3.5 sm:p-4 card-glossy flex items-center justify-between gap-3">
          <button
            onClick={() => setSelectedSale(null)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold btn-secondary-glossy inline-flex items-center gap-2 text-primary hover:text-accent-light transition-all cursor-pointer min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span>Retour aux ventes</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-secondary px-2.5 py-1 rounded-sm bg-white/5 border border-white/10">
              #{selectedSale.itemId || selectedSale.id}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-menthe/10 text-menthe border border-menthe/30">
              Vendu
            </span>
          </div>
        </div>

        {/* Dedicated Sale Page Content */}
        <div className="p-4 sm:p-6 card-glossy space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left: Big Photo & Ouvrir sur Vinted */}
            <div className="space-y-3.5">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 border border-[rgba(255,190,220,0.14)]">
                {selectedSale.photo ? (
                  <img
                    src={selectedSale.photo}
                    alt={selectedSale.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                    <Package size={44} className="opacity-30 mb-2" />
                    <span className="text-xs text-tertiary">Pas de photo</span>
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-secondary border border-white/10">
                    #{selectedSale.itemId || selectedSale.id}
                  </span>
                </div>
              </div>

              {/* Direct Ouvrir sur Vinted button */}
              <a
                href={vintedResolution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold rounded-full btn-secondary-glossy inline-flex items-center justify-center gap-2 text-accent-light hover:text-primary transition-all border border-[rgba(255,143,192,0.25)] hover:border-accent min-h-[44px]"
              >
                <ExternalLink size={15} />
                <span>Ouvrir sur Vinted</span>
              </a>
            </div>

            {/* Right: Detailed Financial & Spec Sheet */}
            <div className="space-y-5">
              
              {/* Title & Brand */}
              <div>
                <span className="text-xs text-accent-light font-medium tracking-wide uppercase">
                  {selectedSale.channel || 'Vinted'}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight mt-0.5">
                  {selectedSale.brand}
                </h1>
                <p className="text-xs sm:text-sm text-secondary mt-1">
                  {selectedSale.title}
                </p>
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-[rgba(255,190,220,0.12)] space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-secondary font-medium">Prix de vente encaissé</span>
                  <span className="text-2xl sm:text-3xl font-bold text-primary font-sans">
                    {formatEur(selectedSale.salePrice)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[rgba(255,190,220,0.06)] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-secondary block text-[11px]">Coût d'achat</span>
                    <span className="font-semibold text-primary font-sans text-sm">
                      {cost > 0 ? formatEur(cost) : '0 € (Gratuit)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Bénéfice net brut</span>
                    <span className="font-bold text-menthe font-sans text-sm">
                      {formatEur(margin, true)} {marginRate ? `(+${marginRate} %)` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Certified Specifications Table (style Vinted) */}
              <div className="rounded-xl border border-[rgba(255,190,220,0.08)] divide-y divide-[rgba(255,190,220,0.06)] text-xs overflow-hidden">
                <div className="p-3 flex items-center justify-between bg-white/[0.01]">
                  <span className="text-secondary">Canal de vente</span>
                  <span className="font-semibold text-primary">{selectedSale.channel || 'Vinted'}</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-secondary">Date de la vente</span>
                  <span className="font-mono text-primary">{selectedSale.saleDate}</span>
                </div>

                {pDate && (
                  <div className="p-3 flex items-center justify-between bg-white/[0.01]">
                    <span className="text-secondary">Date d'achat / mise en ligne</span>
                    <span className="font-mono text-secondary">{pDate}</span>
                  </div>
                )}

                <div className="p-3 flex items-center justify-between">
                  <span className="text-secondary">Délai d'écoulement</span>
                  <span className="text-primary font-medium">{formatDays(days)}</span>
                </div>

                {selectedSale.paymentMethod && (
                  <div className="p-3 flex items-center justify-between bg-white/[0.01]">
                    <span className="text-secondary">Moyen de paiement</span>
                    <span className="text-primary">{selectedSale.paymentMethod}</span>
                  </div>
                )}

                <div className="p-3 flex items-center justify-between bg-white/[0.01]">
                  <span className="text-secondary">Estimation URSSAF (12,3 %)</span>
                  <span className="text-corail font-medium">- {formatEur(urssafTax)}</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-secondary">CA net de cotisations</span>
                  <span className="text-primary font-semibold">{formatEur(netAfterUrssaf)}</span>
                </div>
              </div>

              {/* Bottom return link */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-xs text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5 py-1"
                >
                  <ArrowLeft size={13} />
                  <span>Revenir à la liste des ventes</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Sales List View
  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Header card with Search & Filters */}
      <div className="p-4 sm:p-5 card-glossy">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Livre des ventes
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Historique certifié des {sales.length} ventes avec marges et rotation
            </p>
          </div>
          <span className="text-xs font-mono text-secondary self-start sm:self-auto px-3 py-1 rounded-full bg-white/[0.03] border border-[rgba(255,190,220,0.10)]">
            {filteredSales.length} affichée(s)
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Rechercher par marque ou pièce..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white/[0.03] border border-[rgba(255,190,220,0.12)] rounded-full text-primary placeholder:text-tertiary outline-none focus:border-accent-light transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/[0.03] border border-[rgba(255,190,220,0.12)] rounded-full px-3 py-1.5 text-xs">
            <Filter size={13} className="text-tertiary" />
            <span className="text-secondary text-[11px]">Canal :</span>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-primary outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#17111A] text-primary">Tous les canaux</option>
              <option value="Vinted" className="bg-[#17111A] text-primary">Vinted</option>
              <option value="Flea Market" className="bg-[#17111A] text-primary">Pop-up & Marché</option>
              <option value="Direct" className="bg-[#17111A] text-primary">Vente directe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content: Mobile Cards (< 768px) vs Desktop Sticky Table (>= 768px) */}
      {filteredSales.length === 0 ? (
        <div className="p-8 sm:p-12 card-glossy text-center">
          <Package size={36} className="mx-auto mb-2 text-secondary opacity-40" />
          <h2 className="text-sm sm:text-base font-semibold text-primary mb-1">
            Aucune vente trouvée
          </h2>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            {sales.length === 0
              ? "Dès qu'une pièce est vendue sur Vinted ou en direct, enregistrez-la pour comptabiliser vos marges."
              : "Aucune vente ne correspond à vos critères de recherche ou de filtre."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards cliquables ouvrant la page dédiée */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredSales.map(sale => {
              const margin = sale.salePrice - Number(sale.purchasePrice || 0);
              const pDate = sale.purchaseDate || sale.publishedDate;
              const days = pDate
                ? Math.max(1, Math.round((new Date(sale.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
                : 1;

              return (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="p-4 card-glossy flex items-center gap-3.5 cursor-pointer hover:border-[rgba(255,190,220,0.22)] active:scale-[0.99] transition-all"
                >
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-md bg-white/[0.04] overflow-hidden shrink-0 border border-[rgba(255,190,220,0.10)]">
                    {sale.photo ? (
                      <img src={sale.photo} alt={sale.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary">
                        <Package size={20} className="opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-primary truncate">
                          {sale.brand}
                        </h2>
                        <p className="text-xs text-secondary truncate">
                          {sale.title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-primary font-sans">
                          {formatEur(sale.salePrice)}
                        </div>
                        <div className="text-xs font-semibold text-menthe font-sans">
                          {formatEur(margin, true)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-tertiary">
                      <div className="flex items-center gap-2">
                        <span>{sale.channel || 'Vinted'}</span>
                        <span>·</span>
                        <span>{days} j</span>
                        <span>·</span>
                        <span>{sale.saleDate}</span>
                      </div>
                      <ChevronRight size={14} className="text-tertiary" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Sticky Header Table avec lignes cliquables */}
          <div className="hidden md:block card-glossy overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#17111A] border-b border-[rgba(255,190,220,0.10)]">
                  <tr className="text-xs text-secondary font-normal">
                    <th className="py-3 px-4 font-normal">Date</th>
                    <th className="py-3 px-3 w-14 font-normal">Photo</th>
                    <th className="py-3 px-4 font-normal">Pièce & Marque</th>
                    <th className="py-3 px-3 font-normal">Canal</th>
                    <th className="py-3 px-4 font-normal">Prix de vente</th>
                    <th className="py-3 px-4 font-normal">Coût d'achat</th>
                    <th className="py-3 px-4 font-normal">Marge nette</th>
                    <th className="py-3 px-3 font-normal">Délai</th>
                    <th className="py-3 px-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,190,220,0.06)]">
                  {filteredSales.map(sale => {
                    const margin = sale.salePrice - Number(sale.purchasePrice || 0);
                    const cost = Number(sale.purchasePrice || 0);
                    const pDate = sale.purchaseDate || sale.publishedDate;
                    const days = pDate
                      ? Math.max(1, Math.round((new Date(sale.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
                      : 1;

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-xs font-mono text-secondary">
                          {sale.saleDate}
                        </td>
                        <td className="py-3 px-3">
                          {sale.photo ? (
                            <img
                              src={sale.photo}
                              alt={sale.title}
                              className="w-11 h-11 object-cover rounded-md border border-[rgba(255,190,220,0.10)] group-hover:border-[rgba(255,143,192,0.3)] transition-colors"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-md bg-white/[0.03] border border-dashed border-[rgba(255,190,220,0.12)] flex items-center justify-center text-secondary">
                              <Package size={14} className="opacity-40" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm text-primary group-hover:text-accent-light transition-colors">{sale.brand}</div>
                          <div className="text-xs text-secondary truncate max-w-[260px]">{sale.title}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-[rgba(255,190,220,0.12)] text-secondary">
                            {sale.channel || 'Vinted'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-primary font-sans">
                          {formatEur(sale.salePrice)}
                        </td>
                        <td className="py-3 px-4 text-xs text-secondary font-sans">
                          {cost > 0 ? formatEur(cost) : '0 € (Gratuit)'}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-menthe font-sans">
                          {formatEur(margin, true)}
                        </td>
                        <td className="py-3 px-3 text-xs text-secondary">
                          {days} j
                        </td>
                        <td className="py-3 px-3 text-right">
                          <ChevronRight size={14} className="text-tertiary group-hover:text-accent-light transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
