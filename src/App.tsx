import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase, loadRealVintedDressing } from './db';
import { Item, Sale, VintedItem } from './types';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { InventoryTab } from './components/InventoryTab';
import { AddPieceTab } from './components/AddPieceTab';
import { VintedReconciliationTab } from './components/VintedReconciliationTab';
import { SaleModal } from './components/SaleModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { cleanStr } from './services/matching';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'vinted' | 'add' | 'dashboard'>('inventory');

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Sale Modal state
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedItemForSale, setSelectedItemForSale] = useState<Item | null>(null);
  const [suggestedSalePrice, setSuggestedSalePrice] = useState<number | undefined>(undefined);
  const [suggestedSaleChannel, setSuggestedSaleChannel] = useState<string>('Vinted');

  // IndexedDB Live Queries
  const items = useLiveQuery(() => db.items.toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.orderBy('saleDate').reverse().toArray(), []) || [];
  const vintedCatalog = useLiveQuery(() => db.vintedCatalog.toArray(), []) || [];

  // Init DB & PWA listener on Mount
  useEffect(() => {
    initDatabase();

    // Check iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Check standalone mode
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    }
  };

  // Handlers
  const handleAddItem = async (newItem: Item) => {
    await db.items.add(newItem);
    setActiveTab('inventory');
  };

  const handleOpenSaleModal = (item: Item, suggestedPrice?: number, channel?: string) => {
    setSelectedItemForSale(item);
    setSuggestedSalePrice(suggestedPrice);
    setSuggestedSaleChannel(channel || 'Vinted');
    setSaleModalOpen(true);
  };

  const handleConfirmSale = async (
    item: Item,
    salePrice: number,
    channel: string,
    paymentMethod?: string
  ) => {
    const newSale: Sale = {
      id: `SALE-0${sales.length + 1}`,
      itemId: item.id,
      brand: item.brand,
      title: item.title,
      channel,
      salePrice,
      purchasePrice: item.purchasePrice,
      photo: item.photo,
      saleDate: new Date().toISOString().split('T')[0],
      purchaseDate: item.purchaseDate,
      paymentMethod
    };

    await db.items.delete(item.id);
    await db.sales.add(newSale);
    setActiveTab('dashboard');
  };

  const handleBulkImportAll = async () => {
    let imported = 0;
    const existingTitles = new Set(items.map(i => cleanStr(i.title)));

    const newItems: Item[] = [];
    for (const [idx, vnt] of vintedCatalog.entries()) {
      if (!existingTitles.has(cleanStr(vnt.title))) {
        newItems.push({
          id: `RITA-${String(idx + 1).padStart(3, '0')}`,
          brand: vnt.brand,
          title: vnt.title,
          category: guessCategory(vnt.title),
          size: vnt.size || 'M',
          source: 'Vinted Dressing',
          purchasePrice: 0,
          targetPrice: vnt.price,
          photo: vnt.photo,
          purchaseDate: new Date().toISOString().split('T')[0]
        });
        imported++;
      }
    }

    if (newItems.length > 0) {
      await db.items.bulkAdd(newItems);
      alert(`Success!\nAll ${imported} verified items from Rita's Vinted wardrobe were imported into your active stock.\n\nNote: Initial purchase costs are set to 0 € by default. You can input your actual paid purchase prices directly in the inventory view.`);
      setActiveTab('inventory');
    } else {
      alert("All items from this wardrobe are already in your inventory.");
    }
  };

  const handleUpdatePurchasePrice = async (itemId: string, newPrice: number) => {
    await db.items.update(itemId, { purchasePrice: newPrice });
  };

  const handleQuickAddVintedToCompta = async (vnt: VintedItem) => {
    const costStr = prompt(
      `Enter your actual purchase price for "${vnt.brand} - ${vnt.title}" (€):\n(Leave empty to fill it in later)`,
      "0"
    );
    if (costStr === null) return;

    const cost = parseFloat(costStr) || 0;
    const newItem: Item = {
      id: `LOT-0${items.length + sales.length + 1}`,
      brand: vnt.brand,
      title: vnt.title,
      category: guessCategory(vnt.title),
      size: vnt.size || 'M',
      source: 'Vinted Dressing',
      purchasePrice: cost,
      targetPrice: vnt.price,
      photo: vnt.photo,
      purchaseDate: new Date().toISOString().split('T')[0]
    };

    await db.items.add(newItem);
    alert(`${vnt.brand} added to inventory with an actual purchase cost of ${cost} €.`);
  };

  const guessCategory = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('jacket') || t.includes('veste') || t.includes('blazer') || t.includes('bolero') || t.includes('coat') || t.includes('poncho') || t.includes('cape')) return "Jackets & Coats";
    if (t.includes('boots') || t.includes('heels') || t.includes('loafers') || t.includes('sneakers') || t.includes('chaussures')) return "Shoes & Boots";
    if (t.includes('dress') || t.includes('robe') || t.includes('suit') || t.includes('tailleur')) return "Dresses & Suits";
    if (t.includes('skirt') || t.includes('jupe') || t.includes('trousers') || t.includes('joggers') || t.includes('pantalon')) return "Skirts & Trousers";
    if (t.includes('cardigan') || t.includes('jumper') || t.includes('pull') || t.includes('hoodie')) return "Knitwear & Sweaters";
    if (t.includes('bag') || t.includes('sac')) return "Bags & Leather Goods";
    if (t.includes('gloves') || t.includes('gants') || t.includes('foulard') || t.includes('scarf') || t.includes('belt') || t.includes('ceinture') || t.includes('hat') || t.includes('chapeau')) return "Accessories";
    return "Tops & Shirts";
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-primary">
      
      {/* Header with Mobile Burger Menu & PWA Install Button */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        itemsCount={items.length}
        vintedCount={vintedCatalog.length}
        salesCount={sales.length}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isStandalone={isStandalone}
      />

      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 flex-1">
        
        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 border-b border-border mb-6 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-accent text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>Active Inventory</span>
            <span className="font-mono text-xs px-1.5 py-0.2 bg-surface-elevated text-secondary rounded-full">
              {items.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('vinted')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'vinted'
                ? 'border-accent text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>Vinted Sync</span>
            <span className="font-mono text-xs px-2 py-0.2 bg-profit-soft text-profit rounded-full font-bold">
              {vintedCatalog.length} listed
            </span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'add'
                ? 'border-accent text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Quick Add (+ Photo)
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-accent text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>Sales Dashboard</span>
            {sales.length > 0 && (
              <span className="font-mono text-xs px-2 py-0.2 bg-surface-elevated text-secondary rounded-full">
                {sales.length}
              </span>
            )}
          </button>
        </nav>

        {/* Tab Views */}
        <div className="animate-fade-in">
          {activeTab === 'inventory' && (
            <InventoryTab
              items={items}
              vintedCatalog={vintedCatalog}
              onOpenSaleModal={handleOpenSaleModal}
              onNavigateAdd={() => setActiveTab('add')}
              onUpdatePurchasePrice={handleUpdatePurchasePrice}
            />
          )}
          {activeTab === 'vinted' && (
            <VintedReconciliationTab
              items={items}
              vintedCatalog={vintedCatalog}
              onReloadRealDressing={loadRealVintedDressing}
              onBulkImportAll={handleBulkImportAll}
              onQuickAddVintedToCompta={handleQuickAddVintedToCompta}
              onOpenSaleModal={handleOpenSaleModal}
            />
          )}
          {activeTab === 'add' && (
            <AddPieceTab
              onAddItem={handleAddItem}
              vintedCatalog={vintedCatalog}
              existingItemsCount={items.length + sales.length}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardTab
              sales={sales}
              onNavigateAdd={() => setActiveTab('add')}
            />
          )}
        </div>
      </main>

      {/* Checkout Modal */}
      <SaleModal
        isOpen={saleModalOpen}
        item={selectedItemForSale}
        initialPrice={suggestedSalePrice}
        initialChannel={suggestedSaleChannel}
        onClose={() => setSaleModalOpen(false)}
        onConfirmSale={handleConfirmSale}
      />

      {/* PWA Installation Modal */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isIos={isIos}
        hasNativePrompt={!!deferredPrompt}
        onNativeInstall={handleNativeInstall}
      />
    </div>
  );
};
