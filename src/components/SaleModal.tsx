import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { isCostSet } from '../services/matching';
import { Package } from 'lucide-react';

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
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-strong rounded-md w-full max-w-md p-6 shadow-xl animate-fade-in">
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
          <h3 className="font-heading text-lg font-bold text-primary">Record Sale</h3>
          <span className="font-mono text-xs uppercase tracking-wider text-tertiary">
            REF. #{item.id}
          </span>
        </div>

        <div className="flex items-center gap-3.5 mb-5 p-3 bg-surface-subtle rounded-sm border border-border">
          {item.photo ? (
            <img src={item.photo} alt={item.title} className="w-14 h-14 object-cover rounded-sm border border-border" />
          ) : (
            <div className="w-14 h-14 rounded-sm bg-surface flex items-center justify-center text-secondary">
              <Package size={22} />
            </div>
          )}
          <div>
            <div className="font-heading font-bold text-sm text-primary">{item.brand} — {item.title}</div>
            <div className="text-xs text-secondary mt-0.5">
              Purchase cost:{' '}
              {isCostSet(item.purchasePrice) ? (
                <span className="font-mono font-semibold text-primary">
                  {item.purchasePrice} € {Number(item.purchasePrice) === 0 && <span className="text-profit ml-1 font-semibold">(Gratuit / 100% marge)</span>}
                </span>
              ) : (
                <span className="font-mono text-warning font-semibold">Not set (needs cost)</span>
              )}
            </div>
            {item.purchaseDate && (
              <div className="text-[11px] text-tertiary mt-0.5 font-mono">
                Date de publication : <span className="text-secondary font-semibold">{item.purchaseDate}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
              Sales Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            >
              <option value="Vinted">Vinted (Online)</option>
              <option value="Flea Market">Flea Market / Pop-up</option>
              <option value="Direct">Direct / Private Sale</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
              Final Sale Price (€)
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

          {channel === 'Flea Market' && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
              >
                <option value="Cash">Cash</option>
                <option value="Card (SumUp)">Card (SumUp / POS)</option>
                <option value="Instant Transfer">Instant Transfer (Lydia / Revolut)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-surface border border-border-strong rounded-sm hover:bg-surface-subtle transition-all text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-accent text-white rounded-sm hover:brightness-110 transition-all shadow-sm"
            >
              Confirm Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
