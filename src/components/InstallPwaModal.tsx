import React from 'react';
import { Download, X, Share2, PlusSquare } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIos: boolean;
  onNativeInstall: () => void;
  hasNativePrompt: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  isIos,
  onNativeInstall,
  hasNativePrompt
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-strong rounded-md w-full max-w-md p-6 shadow-2xl animate-fade-in">
        
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-accent" />
            <h3 className="font-heading text-lg font-bold text-primary">Install Kozha</h3>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary p-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 bg-surface-subtle border border-border rounded-sm mb-5">
          <img src="/icon.svg" alt="Kozha Logo" className="w-12 h-12 rounded-sm border border-border" />
          <div>
            <div className="font-heading font-bold text-sm text-primary">Kozha</div>
            <div className="text-xs text-secondary">Instant access, fullscreen & offline mode for flea markets</div>
          </div>
        </div>

        {hasNativePrompt ? (
          <div className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Install Kozha on your home screen or desktop to run it without browser borders, exactly like a native app.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold bg-surface border border-border rounded-sm hover:bg-surface-subtle text-secondary"
              >
                Later
              </button>
              <button
                onClick={() => {
                  onNativeInstall();
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 shadow-sm"
              >
                Install Now
              </button>
            </div>
          </div>
        ) : isIos ? (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-primary">
              On iPhone & iPad (Safari):
            </div>
            <ol className="space-y-3 text-xs text-secondary pl-1">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-accent">1.</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Tap the Share button <Share2 size={14} className="text-accent inline" /> at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-accent">2.</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Scroll down and tap <strong className="text-primary flex items-center gap-1">"Add to Home Screen" <PlusSquare size={13} /></strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-accent">3.</span>
                <span>
                  Tap <strong className="text-primary">Add</strong> in the top right corner. The Kozha icon will be placed directly on your home screen.
                </span>
              </li>
            </ol>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold bg-primary text-canvas rounded-sm"
              >
                Got it
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              To install the application on your device:
            </p>
            <ul className="text-xs text-secondary space-y-2 list-disc list-inside">
              <li>On Chrome / Edge: click the <strong className="text-primary">Install</strong> icon in the address bar.</li>
              <li>On Android: open the browser menu (three dots) and tap <strong className="text-primary">"Add to Home screen"</strong>.</li>
            </ul>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold bg-primary text-canvas rounded-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
