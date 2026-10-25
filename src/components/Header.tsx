import React, { useState } from 'react';
import { Menu, X, Package, RefreshCw, PlusCircle, BarChart3, Download, Smartphone } from 'lucide-react';

interface HeaderProps {
  activeTab: 'inventory' | 'vinted' | 'add' | 'dashboard';
  onTabChange: (tab: 'inventory' | 'vinted' | 'add' | 'dashboard') => void;
  itemsCount: number;
  vintedCount: number;
  salesCount: number;
  onOpenInstallModal?: () => void;
  isStandalone?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  itemsCount,
  vintedCount,
  salesCount,
  onOpenInstallModal,
  isStandalone = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectTab = (tab: 'inventory' | 'vinted' | 'add' | 'dashboard') => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur-md">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
            Rita Compta
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-widest text-accent px-2 py-0.5 border border-accent rounded-sm">
            Luxe Vintage
          </span>
        </div>

        {/* Action Right (Mobile Burger + Quick Install Pill) */}
        <div className="flex items-center gap-2 md:hidden">
          {!isStandalone && onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-surface border border-accent text-accent rounded-sm active:scale-95 transition-all shadow-sm"
              title="Installer l'application"
            >
              <Smartphone size={14} />
              <span>Installer</span>
            </button>
          )}

          {/* Mobile Burger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-sm border border-border-strong bg-surface text-primary hover:bg-surface-subtle transition-all"
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Desktop Quick Indicators & Install Button */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 text-profit">
            <span className="w-2 h-2 rounded-full bg-profit"></span>
            <span>Profil @nuzhdina.ri connecté</span>
          </span>

          {!isStandalone && onOpenInstallModal ? (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-sm hover:brightness-110 shadow-sm transition-all"
            >
              <Download size={14} />
              <span>Installer l'app (PWA)</span>
            </button>
          ) : (
            <span className="font-mono text-[11px] px-2 py-0.5 bg-surface border border-border text-secondary rounded-sm">
              ✓ App installée
            </span>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu (Burger) */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-1 shadow-lg animate-fade-in">
          <button
            onClick={() => handleSelectTab('inventory')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all ${
              activeTab === 'inventory'
                ? 'bg-surface-elevated text-primary font-bold border-l-4 border-accent'
                : 'text-secondary hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package size={17} className="text-accent" />
              <span>Inventaire Actif</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-surface rounded-full border border-border text-secondary">
              {itemsCount}
            </span>
          </button>

          <button
            onClick={() => handleSelectTab('vinted')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all ${
              activeTab === 'vinted'
                ? 'bg-surface-elevated text-primary font-bold border-l-4 border-accent'
                : 'text-secondary hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw size={17} className="text-profit" />
              <span>Rapprochement Vinted</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-profit-soft text-profit rounded-full font-bold">
              {vintedCount} en ligne
            </span>
          </button>

          <button
            onClick={() => handleSelectTab('add')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all ${
              activeTab === 'add'
                ? 'bg-surface-elevated text-primary font-bold border-l-4 border-accent'
                : 'text-secondary hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle size={17} className="text-accent" />
              <span>Saisie Express (+ Photo)</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-surface-elevated text-primary font-bold border-l-4 border-accent'
                : 'text-secondary hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 size={17} className="text-primary" />
              <span>Tableau de Bord des Ventes</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-surface rounded-full border border-border text-secondary">
              {salesCount} vente(s)
            </span>
          </button>

          {/* Installation PWA in Burger Menu */}
          {!isStandalone && onOpenInstallModal && (
            <div className="pt-3 border-t border-border mt-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenInstallModal();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider bg-accent text-white hover:brightness-110 shadow-sm transition-all"
              >
                <Download size={16} />
                <span>📲 Installer sur mon Téléphone</span>
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};
