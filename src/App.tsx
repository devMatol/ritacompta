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
import { cleanStr, guessCategory, isVintedItemImported } from './services/matching';
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

      // 1. Fetch remote items and merge into local Dexie with price rollback protection
      const remoteItems = await cloudFetchItems();
      if (remoteItems) {
        if (remoteItems.length > 0) {
          const localItems = await db.items.toArray();
          const localMap = new Map(localItems.map(i => [i.id, i]));
          
          // Smart merge: Never overwrite an existing valid local price with null.
          // An item only has a valid local price to push to cloud if purchasePrice > 0.
          // If remote is null and local is 0, local is overwritten with null.
          const mergedItems: Item[] = [];
          const toPushToCloud: Item[] = [];

          for (const remote of remoteItems) {
            const local = localMap.get(remote.id);
            const localHasRealPrice = local && typeof local.purchasePrice === 'number' && !isNaN(local.purchasePrice) && local.purchasePrice > 0;

            if (remote.purchasePrice === null && localHasRealPrice) {
              mergedItems.push(local);
              toPushToCloud.push(local);
            } else {
              mergedItems.push(remote);
            }
          }

          await db.items.bulkPut(mergedItems);
          if (toPushToCloud.length > 0) {
            await cloudBulkAddItems(toPushToCloud);
          }
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

    // Purge legacy 0 values in local Dexie so old cache never corrupts cloud
    db.items.toArray().then(localItems => {
      const itemsToFix = localItems.filter(i => i.purchasePrice !== null && Number(i.purchasePrice) <= 0);
      if (itemsToFix.length > 0) {
        itemsToFix.forEach(i => {
          db.items.update(i.id, { purchasePrice: null, costExplicitlySet: false });
        });
      }
    });

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
              const hasCost = r.purchase_price !== null && r.purchase_price !== undefined && r.purchase_price !== '';
              const numPrice = hasCost ? Number(r.purchase_price) : null;
              const remotePrice = (numPrice !== null && !isNaN(numPrice) && numPrice >= 0) ? numPrice : null;

              // Price protection: if remote is null, never wipe out a valid local price
              const localExisting = await db.items.get(r.id);
              const localHasPrice = localExisting && typeof localExisting.purchasePrice === 'number' && localExisting.purchasePrice >= 0 && localExisting.costExplicitlySet === true;
              const finalPrice = (remotePrice === null && localHasPrice)
                ? localExisting.purchasePrice
                : remotePrice;

              await db.items.put({
                id: r.id,
                brand: r.brand,
                title: r.title,
                category: r.category,
                size: r.size || '',
                source: r.source || 'Flea Market',
                purchasePrice: finalPrice,
                targetPrice: Number(r.target_price) || 0,
                photo: r.photo || '',
                purchaseDate: r.purchase_date || '',
                vintedId: r.vinted_id,
                costExplicitlySet: finalPrice !== null
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
      purchasePrice: item.purchasePrice ?? 0,
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
    // Only import pieces that are NOT already in stock and NOT in sales
    const missingVinted = vintedCatalog.filter(v => !isVintedItemImported(v, items, sales));
    if (missingVinted.length === 0) {
      alert("All pieces from this Vinted wardrobe are already imported in your stock or sales archive.");
      return;
    }

    const existingIds = new Set([
      ...items.map(i => i.id),
      ...sales.map(s => s.itemId).filter(Boolean)
    ]);
    let nextNum = items.length + sales.length + 1;

    const newItems: Item[] = [];
    for (const vnt of missingVinted) {
      while (existingIds.has(`RITA-${String(nextNum).padStart(3, '0')}`)) {
        nextNum++;
      }
      const newId = `RITA-${String(nextNum).padStart(3, '0')}`;
      existingIds.add(newId);

      newItems.push({
        id: newId,
        brand: vnt.brand,
        title: vnt.title,
        category: guessCategory(vnt.title),
        size: vnt.size || 'M',
        source: 'Vinted Dressing',
        purchasePrice: null, // Initial cost empty (needs cost)
        targetPrice: vnt.price,
        photo: vnt.photo,
        purchaseDate: new Date().toISOString().split('T')[0],
        costExplicitlySet: false
      });
      nextNum++;
    }

    if (newItems.length > 0) {
      // bulkAdd guarantees zero overwriting of existing items
      await db.items.bulkAdd(newItems);
      if (getSupabaseConfig().isConfigured) {
        await cloudBulkAddItems(newItems);
      }
      alert(`Success!\n${newItems.length} new piece(s) imported into active inventory.\nInitial purchase costs are empty (Needs Cost Price).`);
      setActiveTab('inventory');
    }
  };

  const handleUpdatePurchasePrice = async (itemId: string, newPrice: number | null) => {
    const validPrice = (newPrice !== null && newPrice !== undefined && (newPrice as any) !== '' && !isNaN(Number(newPrice)) && Number(newPrice) >= 0)
      ? Number(newPrice)
      : null;
    await db.items.update(itemId, {
      purchasePrice: validPrice,
      costExplicitlySet: validPrice !== null
    });
    if (getSupabaseConfig().isConfigured) {
      await cloudUpdateItemPrice(itemId, validPrice);
    }
  };

  const handleQuickAddVintedToCompta = async (vnt: VintedItem) => {
    if (isVintedItemImported(vnt, items, sales)) {
      alert(`"${vnt.brand} - ${vnt.title}" is already in your inventory or sold archive.`);
      return;
    }

    const existingIds = new Set([
      ...items.map(i => i.id),
      ...sales.map(s => s.itemId).filter(Boolean)
    ]);
    let nextNum = items.length + sales.length + 1;
    while (existingIds.has(`RITA-${String(nextNum).padStart(3, '0')}`)) {
      nextNum++;
    }
    const newId = `RITA-${String(nextNum).padStart(3, '0')}`;

    const newItem: Item = {
      id: newId,
      brand: vnt.brand,
      title: vnt.title,
      category: guessCategory(vnt.title),
      size: vnt.size || 'M',
      source: 'Vinted Dressing',
      purchasePrice: null,
      targetPrice: vnt.price,
      photo: vnt.photo,
      purchaseDate: new Date().toISOString().split('T')[0],
      costExplicitlySet: false
    };

    await db.items.add(newItem);
    if (getSupabaseConfig().isConfigured) {
      await cloudAddItem(newItem);
    }
    alert(`"${vnt.brand} - ${vnt.title}" imported into active inventory (needs cost price).`);
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
        onSyncNow={syncWithCloud}
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
              sales={sales}
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
