import React, { useState } from 'react';
import { Menu, X, Package, RefreshCw, PlusCircle, BarChart3, Download, Smartphone, Cloud } from 'lucide-react';

interface HeaderProps {
  activeTab: 'inventory' | 'vinted' | 'add' | 'dashboard';
  onTabChange: (tab: 'inventory' | 'vinted' | 'add' | 'dashboard') => void;
  itemsCount: number;
  vintedCount: number;
  salesCount: number;
  onOpenInstallModal?: () => void;
  onOpenCloudModal?: () => void;
  isStandalone?: boolean;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  itemsCount,
  vintedCount,
  salesCount,
  onOpenInstallModal,
  onOpenCloudModal,
  isStandalone = false,
  isCloudConnected = false
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
            Kozha
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-widest text-accent px-2 py-0.5 border border-accent rounded-sm">
            Vintage Luxury
          </span>
        </div>

        {/* Action Right (Mobile Burger + Quick Install Pill) */}
        <div className="flex items-center gap-2 md:hidden">
          {onOpenCloudModal && (
            <button
              onClick={onOpenCloudModal}
              className={`p-1.5 rounded-sm border text-xs flex items-center gap-1 ${
                isCloudConnected
                  ? 'border-profit/40 text-profit bg-profit-soft'
                  : 'border-border text-secondary bg-surface'
              }`}
              title="Cloud Database Sync"
            >
              <Cloud size={14} />
            </button>
          )}

          {!isStandalone && onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-surface border border-accent text-accent rounded-sm active:scale-95 transition-all shadow-sm"
              title="Install application"
            >
              <Smartphone size={14} />
              <span>Install</span>
            </button>
          )}

          {/* Mobile Burger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-sm border border-border-strong bg-surface text-primary hover:bg-surface-subtle transition-all"
            aria-label="Navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Desktop Quick Indicators & Install Button */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          {/* Cloud Sync Status Pill */}
          {onOpenCloudModal && (
            <button
              onClick={onOpenCloudModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border transition-all ${
                isCloudConnected
                  ? 'bg-profit-soft text-profit border-profit/30 hover:brightness-95'
                  : 'bg-surface-subtle text-secondary border-border hover:border-accent hover:text-primary'
              }`}
              title="Click to configure live Supabase synchronization"
            >
              <Cloud size={13} className={isCloudConnected ? 'text-profit' : 'text-secondary'} />
              <span>{isCloudConnected ? 'Cloud Live' : 'Connect Cloud DB'}</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 text-secondary border border-border px-2.5 py-1 rounded-sm bg-surface">
            <span className="w-1.5 h-1.5 rounded-full bg-profit"></span>
            <span>@nuzhdina.ri connected</span>
          </span>

          {!isStandalone && onOpenInstallModal ? (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-accent text-white rounded-sm hover:brightness-110 shadow-sm transition-all"
            >
              <Download size={13} />
              <span>Install App</span>
            </button>
          ) : (
            <span className="font-mono text-[11px] px-2 py-0.5 bg-surface border border-border text-secondary rounded-sm">
              App Installed
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
              <span>Active Inventory</span>
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
              <span>Vinted Sync</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-profit-soft text-profit rounded-full font-bold">
              {vintedCount} listed
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
              <span>Quick Add (+ Photo)</span>
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
              <span>Sales Dashboard</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-surface rounded-full border border-border text-secondary">
              {salesCount} sale(s)
            </span>
          </button>

          {/* Cloud Database Sync in Mobile Drawer */}
          {onOpenCloudModal && (
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCloudModal();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-sm text-xs font-semibold text-secondary hover:bg-surface-subtle transition-all"
              >
                <div className="flex items-center gap-2">
                  <Cloud size={16} className={isCloudConnected ? 'text-profit' : 'text-accent'} />
                  <span>Cloud Database Sync</span>
                </div>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                  isCloudConnected ? 'bg-profit-soft text-profit font-bold' : 'bg-surface border text-tertiary'
                }`}>
                  {isCloudConnected ? 'LIVE' : 'LOCAL'}
                </span>
              </button>
            </div>
          )}

          {/* Installation PWA in Burger Menu */}
          {!isStandalone && onOpenInstallModal && (
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenInstallModal();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider bg-accent text-white hover:brightness-110 shadow-sm transition-all"
              >
                <Download size={16} />
                <span>Install on Device</span>
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};
