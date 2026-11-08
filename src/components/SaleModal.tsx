import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { isCostSet } from '../services/matching';
import { formatEur } from '../services/format';
import { Package, X, Check } from 'lucide-react';

interface SaleModalProps {
  isOpen: boolean;
  item: Item | null;
  initialPrice?: number;
  initialChannel?: string;
  onClose: () => void;
  onConfirmSale: (item: Item, salePrice: number, channel: string, paymentMethod?: string) => void;
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  item,
  initialPrice,
  initialChannel = 'Vinted',
  onClose,
  onConfirmSale
}) => {
  const [salePrice, setSalePrice] = useState<string>('');
  const [channel, setChannel] = useState<string>(initialChannel);
  const [paymentMethod, setPaymentMethod] = useState<string>('Espèces');

  useEffect(() => {
    if (item) {
      const fallbackTarget = item.targetPrice || (item.purchasePrice ? item.purchasePrice * 2.5 : 0);
      setSalePrice(String(initialPrice || fallbackTarget || ''));
      setChannel(initialChannel);
    }
  }, [item, initialPrice, initialChannel]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salePrice) return;
    onConfirmSale(item, parseFloat(salePrice), channel, channel === 'Flea Market' ? paymentMethod : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0A0D]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-glossy w-full max-w-md p-5 sm:p-6 shadow-2xl animate-fade-in relative">
        
        {/* Header */}
        <div className="flex justify-between items-baseline pb-3 mb-4 border-b border-[rgba(255,190,220,0.07)]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary">
              Enregistrer la vente
            </h3>
            <span className="text-[11px] font-mono text-tertiary">
              #{item.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-primary hover:bg-white/5 transition-all"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Item Summary */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,190,220,0.08)] mb-4">
          {item.photo ? (
            <img src={item.photo} alt={item.title} className="w-14 h-14 object-cover rounded-lg border border-white/10 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-black/40 flex items-center justify-center text-secondary shrink-0">
              <Package size={20} className="opacity-40" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-sm text-primary truncate">{item.brand}</div>
            <div className="text-xs text-secondary truncate">{item.title}</div>
            <div className="text-[11px] text-tertiary mt-1">
              Coût d'achat :{' '}
              {isCostSet(item.purchasePrice) ? (
                <span className="text-primary font-medium">
                  {formatEur(item.purchasePrice)} {Number(item.purchasePrice) === 0 && <span className="text-menthe">(Gratuit)</span>}
                </span>
              ) : (
                <span className="text-corail font-medium">Coût à définir</span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Canal de vente
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light cursor-pointer"
            >
              <option value="Vinted" className="bg-[#17111A]">Vinted (En ligne)</option>
              <option value="Flea Market" className="bg-[#17111A]">Pop-up / Marché aux puces</option>
              <option value="Direct" className="bg-[#17111A]">Vente directe / Privée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Prix de vente final (€)
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light"
            />
          </div>

          {channel === 'Flea Market' && (
            <div>
              <label className="block text-xs font-normal text-secondary mb-1">
                Mode de paiement
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light cursor-pointer"
              >
                <option value="Espèces" className="bg-[#17111A]">Espèces</option>
                <option value="Carte (SumUp)" className="bg-[#17111A]">Carte bancaire (SumUp)</option>
                <option value="Virement immédiat" className="bg-[#17111A]">Virement instantané (Lydia / Revolut)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-full btn-secondary-glossy"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-full bg-[rgba(255,143,192,0.16)] border border-[rgba(255,143,192,0.35)] text-accent-pale hover:bg-[rgba(255,143,192,0.25)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Valider la vente</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
