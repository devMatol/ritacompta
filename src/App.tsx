import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase, loadRealVintedDressing, seedInitialInventoryIfEmpty } from './db';
import { Item, Sale, VintedItem } from './types';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { InventoryTab } from './components/InventoryTab';
import { AddPieceTab } from './components/AddPieceTab';
import { VintedReconciliationTab } from './components/VintedReconciliationTab';
import { SaleModal } from './components/SaleModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { cleanStr, guessCategory } from './services/matching';
import {
  getSupabaseConfig,
  getSupabaseClient,
  cloudFetchItems,
  cloudAddItem,
  cloudBulkAddItems,
  cloudUpdateItemPrice,
  cloudDeleteItem,
  cloudFetchSales,
  cloudAddSale,
  cloudFetchVintedCatalog,
  cloudSeedVintedCatalog
} from './db/supabase';

export const App: React.FC = () => {
  // Sales Dashboard is in first position by default
  const [activeTab, setActiveTab] = useState<'inventory' | 'vinted' | 'add' | 'dashboard'>('dashboard');

  // Cloud Database Sync state
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

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

  // Cloud Sync Handler
  const syncWithCloud = useCallback(async () => {
    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      setIsCloudConnected(false);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setIsCloudConnected(false);
      return;
    }

    try {
      setIsCloudConnected(true);

      // 1. Fetch remote items and merge into local Dexie
      const remoteItems = await cloudFetchItems();
      if (remoteItems) {
        if (remoteItems.length > 0) {
          await db.items.bulkPut(remoteItems);
        } else {
          // If remote is empty, ensure local is seeded if empty, then push to remote
          const localCount = await db.items.count();
          if (localCount === 0) {
            await seedInitialInventoryIfEmpty();
          }
          const localItems = await db.items.toArray();
          if (localItems.length > 0) {
            await cloudBulkAddItems(localItems);
          }
        }
      }

      // 2. Fetch remote sales and merge
      const remoteSales = await cloudFetchSales();
      if (remoteSales) {
        if (remoteSales.length > 0) {
          await db.sales.bulkPut(remoteSales);
        } else {
          const localSales = await db.sales.toArray();
          if (localSales.length > 0) {
            for (const s of localSales) {
              await cloudAddSale(s);
            }
          }
        }
      }

      // 3. Fetch remote Vinted catalog
      const remoteCatalog = await cloudFetchVintedCatalog();
      if (remoteCatalog && remoteCatalog.length > 0) {
        await db.vintedCatalog.bulkPut(remoteCatalog);
      } else {
        const localCatalog = await db.vintedCatalog.toArray();
        if (localCatalog.length > 0) {
          await cloudSeedVintedCatalog(localCatalog);
        }
      }
    } catch (e) {
      console.error('Error during cloud sync:', e);
    }
  }, []);

  // Init DB, Cloud & Realtime on Mount
  useEffect(() => {
    initDatabase();

    // Check iOS & standalone
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    // Initial cloud sync
    syncWithCloud();

    // Real-time subscription across all devices
    const client = getSupabaseClient();
    let channel: any = null;

    if (client) {
      channel = client
        .channel('kozha-realtime-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'items' },
          async (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const r = payload.new;
              await db.items.put({
                id: r.id,
                brand: r.brand,
                title: r.title,
                category: r.category,
                size: r.size || '',
                source: r.source || 'Flea Market',
                purchasePrice: Number(r.purchase_price) || 0,
                targetPrice: Number(r.target_price) || 0,
                photo: r.photo || '',
                purchaseDate: r.purchase_date || '',
                vintedId: r.vinted_id
              });
            } else if (payload.eventType === 'DELETE') {
              await db.items.delete(payload.old.id);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          async (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const r = payload.new;
              await db.sales.put({
                id: r.id,
                itemId: r.item_id,
                brand: r.brand,
                title: r.title,
                channel: r.channel,
                salePrice: Number(r.sale_price) || 0,
                purchasePrice: Number(r.purchase_price) || 0,
                photo: r.photo || '',
                saleDate: r.sale_date,
                purchaseDate: r.purchase_date,
                paymentMethod: r.payment_method
              });
            }
          }
        )
        .subscribe();
    }

    // PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [syncWithCloud]);

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

  // Handlers with Cloud Propagation
  const handleAddItem = async (newItem: Item) => {
    await db.items.add(newItem);
    if (getSupabaseConfig().isConfigured) {
      await cloudAddItem(newItem);
    }
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

    if (getSupabaseConfig().isConfigured) {
      await cloudDeleteItem(item.id);
      await cloudAddSale(newSale);
    }

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
      if (getSupabaseConfig().isConfigured) {
        await cloudBulkAddItems(newItems);
      }
      alert(`Success!\nAll ${imported} verified items from Rita's Vinted wardrobe were imported into your active stock.\n\nNote: Initial purchase costs are set to 0 € by default. You can input your actual paid purchase prices directly in the inventory view.`);
      setActiveTab('inventory');
    } else {
      alert("All items from this wardrobe are already in your inventory.");
    }
  };

  const handleUpdatePurchasePrice = async (itemId: string, newPrice: number) => {
    await db.items.update(itemId, { purchasePrice: newPrice });
    if (getSupabaseConfig().isConfigured) {
      await cloudUpdateItemPrice(itemId, newPrice);
    }
  };

  const handleQuickAddVintedToCompta = async (vnt: VintedItem) => {
    const costStr = prompt(
      `Enter your actual purchase price for "${vnt.brand} - ${vnt.title}" (€):\n(Enter 0 if this item is from personal dressing, free, or a gift)`,
      "0"
    );
    if (costStr === null) return;

    const cost = Math.max(0, parseFloat(costStr) || 0);
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
    if (getSupabaseConfig().isConfigured) {
      await cloudAddItem(newItem);
    }
    alert(`${vnt.brand} added to inventory with an actual purchase cost of ${cost} €.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-primary">
      
      {/* Header with Mobile Burger Menu, Cloud Sync & PWA Install Button */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        itemsCount={items.length}
        vintedCount={vintedCatalog.length}
        salesCount={sales.length}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        isStandalone={isStandalone}
        isCloudConnected={isCloudConnected}
      />

      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 flex-1">
        
        {/* Desktop Navigation Tabs - Sales Dashboard in 1st position */}
        <nav className="hidden md:flex items-center gap-1 border-b border-border mb-6 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-accent text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>Sales Dashboard</span>
            <span className="font-mono text-xs px-2 py-0.2 bg-surface-elevated text-secondary rounded-full">
              {sales.length}
            </span>
          </button>
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
              items={items}
              onNavigateAdd={() => setActiveTab('add')}
              onNavigateInventory={() => setActiveTab('inventory')}
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

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        onSyncSuccess={syncWithCloud}
      />
    </div>
  );
};
