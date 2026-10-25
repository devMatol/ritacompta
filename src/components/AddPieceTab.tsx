import React, { useState, useRef } from 'react';
import { Item, VintedItem } from '../types';
import { smartMatch } from '../services/matching';
import { Camera, X } from 'lucide-react';

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
  const [category, setCategory] = useState('Jackets & Coats');
  const [size, setSize] = useState('M');
  const [source, setSource] = useState('Flea Market');
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
    'Diesel'
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
    if (!brand || !title || !purchasePrice) return;

    const pPrice = parseFloat(purchasePrice);
    const tPrice = targetPrice ? parseFloat(targetPrice) : pPrice * 2.5;

    const newItem: Item = {
      id: `LOT-0${existingItemsCount + 1}`,
      brand: brand.trim(),
      title: title.trim(),
      category,
      size: size.trim(),
      source,
      purchasePrice: pPrice,
      targetPrice: tPrice,
      photo: photoBase64,
      purchaseDate: new Date().toISOString().split('T')[0]
    };

    onAddItem(newItem);

    // Instant Match feedback
    const match = smartMatch(newItem, vintedCatalog);
    if (match.matched) {
      alert(`Item recorded successfully.\nSmart reconciliation found a matching listing on Vinted: "${match.vintedItem?.title}" (${match.vintedItem?.price} €).`);
    } else {
      alert(`Item recorded into archive.\nThis piece was not found in your Vinted listings (flagged as "Not on Vinted").`);
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
    <div className="max-w-2xl mx-auto bg-surface border border-border rounded-md p-6 sm:p-8 shadow-sm">
      <div className="border-b border-border pb-4 mb-6">
        <h2 className="font-heading text-2xl font-bold text-primary">Record an Express Purchase</h2>
        <p className="text-xs text-secondary mt-1">
          Capture or upload a photo of the item to archive it with exact acquisition cost.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Photo Upload Box */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
            Item Photo (Camera / Upload)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border-strong rounded-md p-4 text-center bg-surface-subtle hover:border-accent cursor-pointer transition-all"
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
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-sm border border-border"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-primary">Photo ready for archive</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoBase64('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-danger hover:underline mt-1"
                  >
                    <X size={12} />
                    <span>Remove photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-center gap-2 text-2xl mb-1 text-accent">
                  <Camera size={26} />
                </div>
                <div className="text-xs font-bold text-primary">Take a photo or upload an image</div>
                <div className="text-[11px] text-tertiary mt-0.5">Smartphone camera, webcam or drag and drop</div>
              </div>
            )}
          </div>
        </div>

        {/* Brand */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
            Brand
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dolce & Gabbana, Burberry, Céline, Yves Saint Laurent..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {brandSuggestions.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                className="px-2 py-0.5 text-xs bg-surface-subtle border border-border rounded-sm hover:border-accent text-secondary hover:text-primary transition-all"
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Item Name / Model
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Denim jacket 00s, Beige trench coat..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              <option value="Jackets & Coats">Jackets & Coats</option>
              <option value="Bags & Leather Goods">Bags & Leather Goods</option>
              <option value="Shoes & Boots">Shoes & Boots</option>
              <option value="Skirts & Trousers">Skirts & Trousers</option>
              <option value="Dresses & Suits">Dresses & Suits</option>
              <option value="Scarves & Silks">Scarves & Silks</option>
              <option value="Knitwear & Sweaters">Knitwear & Sweaters</option>
              <option value="Tops & Shirts">Tops & Shirts</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
        </div>

        {/* Size & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Size
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. M, 38, One Size..."
              className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Acquisition Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              <option value="Flea Market">Flea Market / Vintage Fair</option>
              <option value="Vinted">Purchased on Vinted</option>
              <option value="Consignment">Consignment Store</option>
              <option value="Private Seller">Private Seller / Estate Sale</option>
            </select>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Purchase Cost (€)
            </label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="e.g. 25"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Target Sale Price (€)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 75"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 transition-all shadow-sm"
          >
            Save to Archive
          </button>
        </div>
      </form>
    </div>
  );
};
