import React, { useState } from 'react';
import { Item, VintedItem } from '../types';
import { smartMatch } from '../services/matching';
import { ExternalLink, Search, RefreshCw, AlertTriangle, CheckCircle2, Plus, Sparkles, Filter } from 'lucide-react';

interface VintedReconciliationTabProps {
  items: Item[];
  vintedCatalog: VintedItem[];
  onReloadRealDressing: () => Promise<any>;
  onBulkImportAll: () => Promise<void>;
  onQuickAddVintedToCompta: (vintedItem: VintedItem) => void;
  onOpenSaleModal: (item: Item, suggestedPrice?: number, channel?: string) => void;
}

export const VintedReconciliationTab: React.FC<VintedReconciliationTabProps> = ({
  items,
  vintedCatalog,
  onReloadRealDressing,
  onBulkImportAll,
  onQuickAddVintedToCompta,
  onOpenSaleModal
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Marque distinctes du dressing réel de Rita
  const brands = ['ALL', ...Array.from(new Set(vintedCatalog.map(v => v.brand))).sort()];

  // Filtrage
  const filteredCatalog = vintedCatalog.filter(vnt => {
    const matchesSearch =
      vnt.title.toLowerCase().includes(search.toLowerCase()) ||
      vnt.brand.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = selectedBrand === 'ALL' || vnt.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  // Détection des pièces en stock compta manquantes sur Vinted
  const missingOnVinted = items.filter(item => !smartMatch(item, vintedCatalog).matched);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await onReloadRealDressing();
    setIsSyncing(false);
  };

  const handleBulkImportPrompt = () => {
    const choice = window.confirm(
      `Voulez-vous importer les ${vintedCatalog.length} articles réels de votre dressing Vinted dans votre inventaire ?\n\n` +
      `• Vos photos, marques, tailles et prix de vente Vinted seront directement enregistrés.\n` +
      `• Les coûts d'achat seront initialement à 0 € (à renseigner par vos soins pour calculer vos marges).`
    );
    if (choice) {
      onBulkImportAll();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Real Vinted Profile Card */}
      <div className="bg-surface border border-border-strong rounded-md p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images1.vinted.net/t/04_0022f_St6xzw65LXTTmnBLKjoGjQPq/f800/23c7e54b.jpeg?s=dc0da82d1fac9a46508e6e8590405f0b8657d1cd"
            alt="Rita Vinted"
            className="w-14 h-14 rounded-full object-cover border-2 border-accent shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg text-primary">@nuzhdina.ri</span>
              <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-profit bg-profit-soft border border-profit/30 px-2 py-0.5 rounded-sm">
                Profil Officiel Connecté
              </span>
            </div>
            <div className="text-xs text-secondary mt-0.5">
              ⭐⭐⭐⭐⭐ <strong>587 avis</strong> · <strong>{vintedCatalog.length} pièces</strong> actives en vitrine · Fontenay-sous-Bois
            </div>
            <div className="text-[11px] text-tertiary italic mt-0.5">
              « making great discounts, especially for bundles 🤍 »
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.vinted.fr/member/68815764-nuzhdinari"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-surface-subtle border border-border rounded-sm hover:border-accent transition-all text-primary"
          >
            <span>Voir mon Dressing sur Vinted</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-border-strong rounded-sm hover:bg-surface-subtle transition-all text-secondary"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            <span>Recharger ({vintedCatalog.length})</span>
          </button>
        </div>
      </div>

      {/* Bulk Import Action Banner */}
      <div className="bg-surface border-l-4 border-accent border border-border rounded-md p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="font-heading font-bold text-base text-primary flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span>Nourrir la base avec les {vintedCatalog.length} articles réels de Rita</span>
          </div>
          <div className="text-xs text-secondary mt-0.5 max-w-xl">
            Toutes ses pièces (Prada, Dolce & Gabbana, Just Cavalli, Plein Sud, Miu Miu, etc.) sont chargées avec leurs vraies photos et prix. Cliquez ci-contre pour les verser dans votre inventaire comptable en 1 clic.
          </div>
        </div>
        <button
          onClick={handleBulkImportPrompt}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={14} />
          <span>⚡ Importer les {vintedCatalog.length} pièces dans mon stock</span>
        </button>
      </div>

      {/* Reconciliation Engine Alerts */}
      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">Moteur Intelligent de Rapprochement</h2>
            <p className="text-xs text-secondary mt-0.5">
              Détecte les pièces en stock manquantes sur Vinted, et les pièces en ligne à chiffrer.
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold px-2 py-0.5 border border-accent rounded-sm">
            Algorithme Temps Réel
          </span>
        </div>

        {missingOnVinted.length > 0 ? (
          <div className="p-4 bg-surface-subtle border-l-4 border-warning border border-border rounded-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warning">
                <AlertTriangle size={15} />
                <span>⚠️ {missingOnVinted.length} Pièce(s) en Stock Manquante(s) sur Vinted</span>
              </div>
              <div className="font-heading font-bold text-sm text-primary mt-1">
                {missingOnVinted.map(i => `${i.brand} (${i.title})`).join(', ')}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Ces pièces figurent dans votre stock d'achats mais sont introuvables sur votre dressing public Vinted. Sont-elles en attente de mise en ligne, ou ont-elles été vendues sur un marché ?
              </p>
            </div>
            <button
              onClick={() => onOpenSaleModal(missingOnVinted[0], undefined, 'Marché')}
              className="px-3 py-1.5 text-xs font-semibold bg-surface border border-border-strong rounded-sm hover:border-accent transition-all text-primary"
            >
              Encaisser Vente Marché
            </button>
          </div>
        ) : (
          <div className="p-3 bg-profit-soft text-profit rounded-sm text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>✓ Toutes vos pièces en stock sont parfaitement synchronisées avec votre vitrine Vinted !</span>
          </div>
        )}
      </div>

      {/* Real Dressing Table */}
      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-baseline gap-4 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-primary">
              Le Dressing Complet de Rita ({filteredCatalog.length} / {vintedCatalog.length} Pièces)
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Articles réels extraits en direct de son dressing officiel avec leurs photos haute résolution.
            </p>
          </div>
          <span className="font-mono text-xs text-tertiary">120 Pièces Réelles</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Filtrer par marque (Prada, D&G, Miu Miu...) ou vêtement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-tertiary" />
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="py-1.5 px-3 text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              {brands.map(b => (
                <option key={b} value={b}>
                  {b === 'ALL' ? 'Toutes les Marques' : b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-border rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border-strong bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <th className="py-2.5 px-3 w-14">Photo</th>
                <th className="py-2.5 px-3">Titre de l'Annonce</th>
                <th className="py-2.5 px-3">Marque</th>
                <th className="py-2.5 px-3">Taille & État</th>
                <th className="py-2.5 px-3">Prix Vinted</th>
                <th className="py-2.5 px-3">Statut Compta</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCatalog.map(vnt => {
                const matchedStock = items.find(s => smartMatch(s, [vnt]).matched);

                return (
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
                        <div className="w-12 h-12 rounded-sm bg-surface-subtle flex items-center justify-center text-sm border border-border">
                          👗
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-heading font-bold text-sm text-primary">{vnt.title}</div>
                      <a
                        href={vnt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>Voir sur Vinted</span>
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-xs text-primary">
                      {vnt.brand}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs">
                      <span>{vnt.size}</span> · <span className="text-secondary text-[11px]">{vnt.condition}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sm font-bold text-primary">
                      {vnt.price} €
                    </td>
                    <td className="py-2.5 px-3">
                      {matchedStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-profit bg-profit-soft border border-profit/25 px-2 py-0.5 rounded-sm">
                          ✓ En Stock (#{matchedStock.id})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-surface-subtle border border-border px-2 py-0.5 rounded-sm">
                          Non Importé
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {matchedStock ? (
                        <button
                          onClick={() => onOpenSaleModal(matchedStock, vnt.price, 'Vinted')}
                          className="px-2.5 py-1 text-xs font-semibold bg-surface border border-border-strong rounded-sm hover:border-accent text-primary transition-all"
                        >
                          Encaisser Vente
                        </button>
                      ) : (
                        <button
                          onClick={() => onQuickAddVintedToCompta(vnt)}
                          className="px-2.5 py-1 text-xs font-semibold bg-primary text-canvas rounded-sm hover:opacity-90 transition-all whitespace-nowrap"
                        >
                          + Ajouter au Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
