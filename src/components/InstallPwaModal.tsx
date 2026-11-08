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
    <div className="fixed inset-0 z-50 bg-[#0E0A0D]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-glossy w-full max-w-md p-5 sm:p-6 shadow-2xl animate-fade-in relative">
        
        <div className="flex justify-between items-baseline pb-3 mb-4 border-b border-[rgba(255,190,220,0.07)]">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-accent-light" />
            <h3 className="text-base sm:text-lg font-bold text-primary">Installer Kozha</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-secondary hover:text-primary transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,190,220,0.08)] mb-4">
          <img src="/icon.svg" alt="Kozha Logo" className="w-12 h-12 rounded-lg border border-white/10 shrink-0" />
          <div>
            <div className="font-semibold text-sm text-primary">Kozha — Vintage Luxury</div>
            <div className="text-xs text-secondary mt-0.5">Accès plein écran, instantané et hors-ligne pour vos pop-ups et marchés</div>
          </div>
        </div>

        {hasNativePrompt ? (
          <div className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Installez Kozha sur votre écran d'accueil pour l'utiliser sans barre d'adresse de navigateur, comme une application native.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-full btn-secondary-glossy"
              >
                Plus tard
              </button>
              <button
                onClick={() => {
                  onNativeInstall();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-[rgba(255,143,192,0.18)] border border-[rgba(255,143,192,0.35)] text-accent-pale hover:bg-[rgba(255,143,192,0.28)] transition-all cursor-pointer"
              >
                Installer maintenant
              </button>
            </div>
          </div>
        ) : isIos ? (
          <div className="space-y-3.5">
            <div className="text-xs font-medium text-primary">
              Sur iPhone & iPad (Safari) :
            </div>
            <ol className="space-y-2.5 text-xs text-secondary pl-1">
              <li className="flex items-start gap-2">
                <span className="font-mono text-accent-light">1.</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Appuyez sur le bouton Partager <Share2 size={13} className="text-accent-light inline" /> en bas de Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-accent-light">2.</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Faites défiler vers le bas et touchez <strong className="text-primary flex items-center gap-1">"Sur l'écran d'accueil" <PlusSquare size={13} /></strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-accent-light">3.</span>
                <span>
                  Touchez <strong className="text-primary">Ajouter</strong> en haut à droite. L'icône Kozha sera installée sur votre écran d'accueil.
                </span>
              </li>
            </ol>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-full btn-secondary-glossy"
              >
                Compris
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <p className="text-xs text-secondary leading-relaxed">
              Pour installer l'application :
            </p>
            <ul className="text-xs text-secondary space-y-1.5 list-disc list-inside">
              <li>Sur Chrome / Edge : cliquez sur l'icône <strong className="text-primary">Installer</strong> dans la barre d'adresse.</li>
              <li>Sur Android : ouvrez le menu (trois points) et appuyez sur <strong className="text-primary">"Ajouter à l'écran d'accueil"</strong>.</li>
            </ul>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-full btn-secondary-glossy"
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
