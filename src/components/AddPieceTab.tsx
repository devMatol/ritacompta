import React, { useState, useRef } from 'react';
import { Item, VintedItem } from '../types';
import { smartMatch } from '../services/matching';
import { Camera, X, Check } from 'lucide-react';

interface AddPieceTabProps {
  onAddItem: (item: Item) => void;
  vintedCatalog: VintedItem[];
  existingItemsCount: number;
}

export const AddPieceTab: React.FC<AddPieceTabProps> = ({
  onAddItem,
  vintedCatalog,
  existingItemsCount
}) => {
  const [brand, setBrand] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Vestes & Manteaux');
  const [size, setSize] = useState('M');
  const [source, setSource] = useState('Marché / Brocante');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const brandSuggestions = [
    'Dolce & Gabbana',
    'Burberry',
    'Miu Miu',
    'Céline',
    'Yves Saint Laurent',
    'Hermès',
    'Courrèges',
    'Morgan',
    'Diesel',
    'Balenciaga',
    'Gucci'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !title.trim()) return;

    const pPrice = purchasePrice === '' ? null : Math.max(0, parseFloat(purchasePrice) || 0);
    const parsedTarget = targetPrice !== '' ? parseFloat(targetPrice) : NaN;
    const tPrice = !isNaN(parsedTarget) ? Math.max(0, parsedTarget) : (pPrice !== null && pPrice > 0 ? pPrice * 2.5 : 0);

    const newItem: Item = {
      id: `RITA-${String(existingItemsCount + 1).padStart(3, '0')}`,
      brand: brand.trim(),
      title: title.trim(),
      category,
      size: size.trim(),
      source,
      purchasePrice: pPrice,
      targetPrice: tPrice,
      photo: photoBase64,
      purchaseDate: new Date().toISOString().split('T')[0],
      costExplicitlySet: pPrice !== null
    };

    onAddItem(newItem);

    // Instant Match feedback
    const match = smartMatch(newItem, vintedCatalog);
    if (match.matched) {
      alert(`Pièce ajoutée au stock.\nRéconciliation Vinted automatique : "${match.vintedItem?.title}" (${match.vintedItem?.price} €).`);
    } else {
      alert(`Pièce enregistrée dans l'inventaire.`);
    }

    // Reset
    setBrand('');
    setTitle('');
    setPurchasePrice('');
    setTargetPrice('');
    setPhotoBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto p-5 sm:p-7 card-glossy animate-fade-in">
      <div className="pb-4 mb-5 border-b border-[rgba(255,190,220,0.07)]">
        <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
          Ajout rapide d'une pièce
        </h1>
        <p className="text-xs text-secondary mt-0.5">
          Prenez une photo et enregistrez votre coût d'acquisition pour alimenter le stock.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Photo Upload Box */}
        <div>
          <label className="block text-xs font-normal text-secondary mb-1.5">
            Photo de la pièce
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[rgba(255,190,220,0.14)] hover:border-accent-light rounded-xl p-4 text-center bg-white/[0.02] cursor-pointer transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {photoBase64 ? (
              <div className="flex items-center justify-center gap-4">
                <img
                  src={photoBase64}
                  alt="Aperçu"
                  className="w-16 h-16 object-cover rounded-lg border border-[rgba(255,190,220,0.12)]"
                />
                <div className="text-left">
                  <div className="text-xs font-medium text-primary">Photo prête pour le stock</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoBase64('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-corail hover:underline mt-1"
                  >
                    <X size={12} />
                    <span>Retirer la photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-center text-accent mb-1.5">
                  <Camera size={26} strokeWidth={1.5} />
                </div>
                <div className="text-xs font-medium text-primary">Prendre une photo ou importer une image</div>
                <div className="text-[11px] text-tertiary mt-0.5">Appareil photo smartphone ou fichier</div>
              </div>
            )}
          </div>
        </div>

        {/* Marque */}
        <div>
          <label className="block text-xs font-normal text-secondary mb-1">
            Marque *
          </label>
          <input
            type="text"
            required
            placeholder="Ex : Dolce & Gabbana, Céline, Courrèges..."
            value={brand}
            onChange={e => setBrand(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary placeholder:text-tertiary outline-none focus:border-accent-light focus:shadow-[0_0_12px_rgba(255,95,162,0.20)] transition-all"
          />
          {/* Quick brand pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {brandSuggestions.slice(0, 6).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-secondary hover:text-primary transition-all border border-[rgba(255,190,220,0.08)]"
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Intitulé */}
        <div>
          <label className="block text-xs font-normal text-secondary mb-1">
            Intitulé de la pièce *
          </label>
          <input
            type="text"
            required
            placeholder="Ex : Veste en cuir vintage coupe cintrée..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary placeholder:text-tertiary outline-none focus:border-accent-light focus:shadow-[0_0_12px_rgba(255,95,162,0.20)] transition-all"
          />
        </div>

        {/* Catégorie & Taille */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light cursor-pointer"
            >
              <option value="Vestes & Manteaux" className="bg-[#17111A]">Vestes & Manteaux</option>
              <option value="Hauts & Mailles" className="bg-[#17111A]">Hauts & Mailles</option>
              <option value="Robes & Jupes" className="bg-[#17111A]">Robes & Jupes</option>
              <option value="Pantalons & Jeans" className="bg-[#17111A]">Pantalons & Jeans</option>
              <option value="Sacs & Maroquinerie" className="bg-[#17111A]">Sacs & Maroquinerie</option>
              <option value="Chaussures" className="bg-[#17111A]">Chaussures</option>
              <option value="Accessoires" className="bg-[#17111A]">Accessoires</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Taille
            </label>
            <input
              type="text"
              placeholder="Ex : M, 38, Unique..."
              value={size}
              onChange={e => setSize(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary placeholder:text-tertiary outline-none focus:border-accent-light focus:shadow-[0_0_12px_rgba(255,95,162,0.20)] transition-all"
            />
          </div>
        </div>

        {/* Prix d'achat & Prix cible */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Prix d'achat (€)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="0 si gratuit"
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary placeholder:text-tertiary outline-none focus:border-accent-light focus:shadow-[0_0_12px_rgba(255,95,162,0.20)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Prix de vente cible (€)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="Automatique si vide"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary placeholder:text-tertiary outline-none focus:border-accent-light focus:shadow-[0_0_12px_rgba(255,95,162,0.20)] transition-all"
            />
          </div>
        </div>

        {/* Provenance */}
        <div>
          <label className="block text-xs font-normal text-secondary mb-1">
            Provenance / Source
          </label>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light cursor-pointer"
          >
            <option value="Marché / Brocante" className="bg-[#17111A]">Marché aux puces / Brocante</option>
            <option value="Vinted" className="bg-[#17111A]">Achat Vinted</option>
            <option value="Dépôt-vente" className="bg-[#17111A]">Dépôt-vente</option>
            <option value="Dressing personnel" className="bg-[#17111A]">Dressing personnel (Gratuit)</option>
            <option value="Particulier" className="bg-[#17111A]">Vendeur particulier</option>
          </select>
        </div>

        {/* Bouton "Enregistrer l'achat" : le SEUL bouton plein rose de l'appli */}
        <div className="pt-3">
          <button
            type="submit"
            className="w-full min-h-[48px] py-3 px-6 text-sm font-bold rounded-2xl btn-primary-pink flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Enregistrer l'achat</span>
          </button>
        </div>

      </form>
    </div>
  );
};
