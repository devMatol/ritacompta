import React, { useState, useEffect } from 'react';
import { Item } from '../types';

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
      setSalePrice(String(initialPrice || item.targetPrice || item.purchasePrice * 2.5));
      setChannel(initialChannel);
    }
  }, [item, initialPrice, initialChannel]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salePrice) return;
    onConfirmSale(item, parseFloat(salePrice), channel, channel === 'Marché' ? paymentMethod : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-strong rounded-md w-full max-w-md p-6 shadow-xl animate-fade-in">
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
          <h3 className="font-heading text-lg font-bold text-primary">Enregistrer la Vente</h3>
          <span className="font-mono text-xs uppercase tracking-wider text-tertiary">
            RÉF. #{item.id}
          </span>
        </div>

        <div className="flex items-center gap-3.5 mb-5 p-3 bg-surface-subtle rounded-sm border border-border">
          {item.photo ? (
            <img src={item.photo} alt={item.title} className="w-14 h-14 object-cover rounded-sm border border-border" />
          ) : (
            <div className="w-14 h-14 rounded-sm bg-surface flex items-center justify-center text-xl">🧥</div>
          )}
          <div>
            <div className="font-heading font-bold text-sm text-primary">{item.brand} — {item.title}</div>
            <div className="text-xs text-secondary mt-0.5">
              Coût d'achat : <span className="font-mono font-semibold text-primary">{item.purchasePrice} €</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
              Canal de Vente
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              <option value="Vinted">Vinted (Vente en ligne)</option>
              <option value="Marché">Marché aux Puces / Stand</option>
              <option value="Direct">Vente Directe / Privée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
              Prix Final Vendu Net (€)
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          {channel === 'Marché' && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
                Moyen de Paiement Marché
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
              >
                <option value="Espèces">Espèces (Cash)</option>
                <option value="CB SumUp">Carte Bancaire (SumUp)</option>
                <option value="Lydia / Paylib">Lydia / Paylib</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-surface border border-border-strong rounded-sm hover:bg-surface-subtle transition-all text-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-accent text-white rounded-sm hover:brightness-110 transition-all shadow-sm"
            >
              Valider l'Encaissement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
