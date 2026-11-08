import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import { formatEur, formatDays } from '../services/format';
import { Package, Search, Filter } from 'lucide-react';

interface SalesTabProps {
  sales: Sale[];
}

export const SalesTab: React.FC<SalesTabProps> = ({ sales }) => {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'Vinted' | 'Flea Market' | 'Direct'>('ALL');

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
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredSales.map(sale => {
              const margin = sale.salePrice - Number(sale.purchasePrice || 0);
              const cost = Number(sale.purchasePrice || 0);
              const pDate = sale.purchaseDate || sale.publishedDate;
              const days = pDate
                ? Math.max(1, Math.round((new Date(sale.saleDate).getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)))
                : 1;

              return (
                <div key={sale.id} className="p-4 card-glossy flex items-center gap-3.5">
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

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-tertiary">
                      <span>{sale.channel || 'Vinted'}</span>
                      <span>·</span>
                      <span>Vendu en {days} j</span>
                      <span>·</span>
                      <span>{sale.saleDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Sticky Header Table */}
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
                      <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-secondary">
                          {sale.saleDate}
                        </td>
                        <td className="py-3 px-3">
                          {sale.photo ? (
                            <img
                              src={sale.photo}
                              alt={sale.title}
                              className="w-11 h-11 object-cover rounded-md border border-[rgba(255,190,220,0.10)]"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-md bg-white/[0.03] border border-dashed border-[rgba(255,190,220,0.12)] flex items-center justify-center text-secondary">
                              <Package size={14} className="opacity-40" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm text-primary">{sale.brand}</div>
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
