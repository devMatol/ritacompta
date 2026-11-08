import React, { useState, useEffect } from 'react';
import { Menu, X, RefreshCw, Smartphone, Cloud, AlertCircle } from 'lucide-react';

export type TabType = 'dashboard' | 'inventory' | 'sales' | 'vinted' | 'add';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  itemsCount: number;
  salesCount: number;
  vintedActionCount?: number;
  onOpenInstallModal?: () => void;
  onOpenCloudModal?: () => void;
  onSyncNow?: () => Promise<void> | void;
  isStandalone?: boolean;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  itemsCount,
  salesCount,
  vintedActionCount = 0,
  onOpenInstallModal,
  onOpenCloudModal,
  onSyncNow,
  isStandalone = false,
  isCloudConnected = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleManualSync = async () => {
    if (onSyncNow) {
      setIsSyncing(true);
      try {
        await onSyncNow();
      } finally {
        setTimeout(() => setIsSyncing(false), 500);
      }
    }
  };

  const handleSelectTab = (tab: TabType) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const navItems: { id: TabType; label: string; count?: number; badgeAlert?: boolean }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'inventory', label: 'Stock', count: itemsCount },
    { id: 'sales', label: 'Ventes', count: salesCount },
    { id: 'vinted', label: 'Synchro Vinted', badgeAlert: vintedActionCount > 0 },
    { id: 'add', label: 'Ajout rapide' }
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[rgba(255,190,220,0.10)] bg-[#0E0A0D]/90 backdrop-blur-xl">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Kozha + Mention "Vintage luxe" */}
          <div className="flex items-baseline gap-2.5 shrink-0">
            <span className="font-serif italic text-2xl sm:text-[26px] tracking-wide text-primary">
              Kozha
            </span>
            <span className="text-xs text-accent-light tracking-wide font-normal">
              Vintage luxe
            </span>
          </div>

          {/* Desktop Navigation Tabs (Pilules avec fond actif translucide) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-white/[0.03] border border-[rgba(255,190,220,0.08)] rounded-full">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative px-4 py-1.5 text-[13px] transition-all rounded-full cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[rgba(255,143,192,0.14)] text-accent-pale font-semibold shadow-xs'
                      : 'text-[#C9B8C2] hover:text-primary hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && (
                    <span className={`text-[11px] font-mono ${isActive ? 'text-accent-pale' : 'text-tertiary'}`}>
                      ({item.count})
                    </span>
                  )}
                  {item.badgeAlert && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Action requise" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right: Indicateur simple "● Synchronisé" / "● Hors ligne" */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCloudModal}
              className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-full bg-white/[0.02] border border-[rgba(255,190,220,0.08)] hover:border-[rgba(255,190,220,0.20)] transition-all cursor-pointer"
              title="Statut de synchronisation Cloud Supabase"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isCloudConnected ? 'bg-menthe shadow-[0_0_8px_rgba(127,227,181,0.6)]' : 'bg-corail'
                }`}
              />
              <span className={`font-medium ${isCloudConnected ? 'text-menthe' : 'text-corail'}`}>
                {isCloudConnected ? 'Synchronisé' : 'Hors ligne'}
              </span>
            </button>
          </div>

          {/* Mobile Right: Status indicator + Burger Button (44px min) */}
          <div className="flex md:hidden items-center gap-2">
            <div
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-white/[0.03] border border-[rgba(255,190,220,0.08)] text-[11px]"
              title={isCloudConnected ? 'Synchronisé' : 'Hors ligne'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudConnected ? 'bg-menthe shadow-[0_0_6px_rgba(127,227,181,0.5)]' : 'bg-corail'
                }`}
              />
              <span className={isCloudConnected ? 'text-menthe' : 'text-corail'}>
                {isCloudConnected ? 'Sync' : 'Offline'}
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-md bg-white/[0.03] border border-[rgba(255,190,220,0.12)] text-primary hover:text-accent active:scale-95 transition-all"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE FULL-SCREEN MENU (< 768px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E0A0D]/[0.98] backdrop-blur-2xl flex flex-col justify-between p-5 animate-fade-in md:hidden">
          
          {/* Top Bar with Logo & Close Button */}
          <div className="flex items-center justify-between h-14 border-b border-[rgba(255,190,220,0.10)] pb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-serif italic text-2xl text-primary">Kozha</span>
              <span className="text-xs text-accent-light">Vintage luxe</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-md text-secondary hover:text-primary active:scale-95"
              aria-label="Fermer le menu"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation Links (grandes lignes de 56px) */}
          <div className="flex-1 py-6 flex flex-col justify-center space-y-2">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full min-h-[56px] px-5 rounded-2xl flex items-center justify-between text-base font-medium transition-all ${
                    isActive
                      ? 'bg-[rgba(255,143,192,0.14)] text-accent-pale shadow-xs border border-[rgba(255,143,192,0.25)]'
                      : 'text-[#C9B8C2] hover:text-primary hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-base font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {typeof item.count === 'number' && (
                      <span className="text-xs font-mono text-secondary">
                        {item.count}
                      </span>
                    )}
                    {item.badgeAlert && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-[#2B0717] font-bold">
                        Action
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-[rgba(255,190,220,0.10)] space-y-3">
            
            {/* Account & Status info */}
            <div className="flex items-center justify-between text-xs px-2 text-secondary">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-menthe" />
                <span>@nuzhdina.ri (Vinted)</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenCloudModal) onOpenCloudModal();
                }}
                className={`font-medium ${isCloudConnected ? 'text-menthe' : 'text-corail'} hover:underline`}
              >
                {isCloudConnected ? 'Cloud actif' : 'Configurer Cloud'}
              </button>
            </div>

            {/* Sync Now button */}
            {onSyncNow && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-full bg-white/[0.04] border border-[rgba(255,190,220,0.12)] text-primary hover:bg-white/[0.08] text-xs font-medium transition-all"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin text-accent" : "text-secondary"} />
                <span>{isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}</span>
              </button>
            )}

            {/* Install PWA button (if available and not installed) */}
            {!isStandalone && onOpenInstallModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenInstallModal();
                }}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-full bg-[rgba(255,143,192,0.10)] border border-[rgba(255,143,192,0.25)] text-accent-pale text-xs font-medium transition-all"
              >
                <Smartphone size={14} />
                <span>Installer l'application</span>
              </button>
            )}

          </div>

        </div>
      )}
    </>
  );
};
