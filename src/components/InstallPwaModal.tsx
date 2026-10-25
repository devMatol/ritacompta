import React from 'react';
import { Download, X, Share2, PlusSquare, Check } from 'lucide-react';

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
            <h3 className="font-heading text-lg font-bold text-primary">Installer Kozha</h3>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary p-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 bg-surface-subtle border border-border rounded-sm mb-5">
          <img src="/icon.svg" alt="Kozha Logo" className="w-12 h-12 rounded-sm border border-border" />
          <div>
            <div className="font-heading font-bold text-sm text-primary">Kozha</div>
            <div className="text-xs text-secondary">Accès instantané, plein écran & mode hors ligne sur les marchés</div>
          </div>
        </div>

        {hasNativePrompt ? (
          <div className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Installez Kozha sur votre écran d'accueil ou sur votre ordinateur pour l'utiliser sans barre de navigateur, comme une application native.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold bg-surface border border-border rounded-sm hover:bg-surface-subtle text-secondary"
              >
                Plus tard
              </button>
              <button
                onClick={() => {
                  onNativeInstall();
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 shadow-sm"
              >
                Installer maintenant
              </button>
            </div>
          </div>
        ) : isIos ? (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-primary">
              Sur iPhone & iPad (Safari) :
            </div>
            <ol className="space-y-3 text-xs text-secondary pl-1">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-accent">1.</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Touchez le bouton de partage <Share2 size={14} className="text-accent inline" /> en bas de l'écran dans Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-accent">2.</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Faites défiler vers le bas et touchez <strong className="text-primary flex items-center gap-1">« Sur l'écran d'accueil » <PlusSquare size={13} /></strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-accent">3.</span>
                <span>
                  Touchez <strong className="text-primary">Ajouter</strong> en haut à droite. L'icône Kozha apparaîtra directement sur votre écran d'accueil !
                </span>
              </li>
            </ol>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold bg-primary text-canvas rounded-sm"
              >
                Compris !
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Pour installer l'application sur votre appareil :
            </p>
            <ul className="text-xs text-secondary space-y-2 list-disc list-inside">
              <li>Sur Chrome / Edge : cliquez sur l'icône <strong className="text-primary">Installer</strong> dans la barre d'adresse en haut à droite.</li>
              <li>Sur Android : appuyez sur le menu (⋮) puis sur <strong className="text-primary">« Ajouter à l'écran d'accueil »</strong>.</li>
            </ul>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold bg-primary text-canvas rounded-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
