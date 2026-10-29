import Dexie, { type Table } from 'dexie';
import { Item, Sale, VintedItem } from '../types';
import { guessCategory } from '../services/matching';
import { getSupabaseConfig, cloudFetchVintedCatalog } from './supabase';

export class KozhaDatabase extends Dexie {
  items!: Table<Item, string>;
  sales!: Table<Sale, string>;
  vintedCatalog!: Table<VintedItem, string>;

  constructor() {
    super('KozhaDB');
    this.version(1).stores({
      items: 'id, brand, title, category, purchaseDate',
      sales: 'id, brand, channel, saleDate',
      vintedCatalog: 'id, brand, title'
    });
  }
}

export const db = new KozhaDatabase();

// Load verified live items from Rita's Vinted wardrobe into vintedCatalog
export async function loadRealVintedDressing(force = false): Promise<VintedItem[]> {
  try {
    // 1. First, attempt to call the live Vinted sync API (/api/vinted-sync)
    try {
      const url = force ? `/api/vinted-sync?force=true&t=${Date.now()}` : `/api/vinted-sync?t=${Date.now()}`;
      const liveRes = await fetch(url);
      if (liveRes.ok) {
        const json = await liveRes.json();
        if (json.success && Array.isArray(json.items) && json.items.length > 0) {
          const liveItems: VintedItem[] = json.items;
          await db.transaction('rw', db.vintedCatalog, async () => {
            await db.vintedCatalog.clear();
            await db.vintedCatalog.bulkPut(liveItems);
          });
          console.log(`Live Vinted sync complete: ${liveItems.length} items loaded directly from Vinted.`);
          return liveItems;
        }
      }
    } catch (apiErr) {
      console.warn('Live API sync failed, falling back to Supabase/JSON:', apiErr);
    }

    // 2. Fallback: Try pulling live catalog from Supabase cloud
    if (getSupabaseConfig().isConfigured) {
      const cloudCatalog = await cloudFetchVintedCatalog();
      if (cloudCatalog && cloudCatalog.length > 0) {
        await db.transaction('rw', db.vintedCatalog, async () => {
          await db.vintedCatalog.clear();
          await db.vintedCatalog.bulkPut(cloudCatalog);
        });
        return cloudCatalog;
      }
    }

    // 3. Fallback to public JSON
    const res = await fetch(`/rita_vinted_dressing.json?t=${Date.now()}`);
    if (!res.ok) return [];
    const items: VintedItem[] = await res.json();
    
    await db.transaction('rw', db.vintedCatalog, async () => {
      await db.vintedCatalog.clear();
      await db.vintedCatalog.bulkPut(items);
    });
    return items;
  } catch (err) {
    console.error('Error loading Vinted wardrobe:', err);
    return [];
  }
}

// Automatically populate the active inventory with Rita's 120 items if empty
export async function seedInitialInventoryIfEmpty(): Promise<number> {
  try {
    const count = await db.items.count();
    if (count > 0) return count;

    const res = await fetch('/rita_vinted_dressing.json');
    if (!res.ok) return 0;
    const vntItems: VintedItem[] = await res.json();

    const initialItems: Item[] = vntItems.map((vnt, idx) => ({
      id: `RITA-${String(idx + 1).padStart(3, '0')}`,
      brand: vnt.brand,
      title: vnt.title,
      category: guessCategory(vnt.title),
      size: vnt.size || 'M',
      source: 'Vinted Dressing',
      purchasePrice: null,
      targetPrice: vnt.price,
      photo: vnt.photo,
      purchaseDate: vnt.publishedDate || new Date().toISOString().split('T')[0],
      publishedDate: vnt.publishedDate,
      costExplicitlySet: false
    }));

    await db.transaction('rw', db.items, async () => {
      await db.items.bulkPut(initialItems);
    });

    console.log(`Initial active inventory seeded with ${initialItems.length} items.`);
    return initialItems.length;
  } catch (err) {
    console.error('Error seeding initial inventory:', err);
    return 0;
  }
}

export async function initDatabase() {
  try {
    await db.open();

    const countVinted = await db.vintedCatalog.count();
    if (countVinted === 0) {
      await loadRealVintedDressing();
    }

    // Only seed fallback local stock if Supabase is NOT configured and local stock is empty
    const { isConfigured } = getSupabaseConfig();
    const countItems = await db.items.count();
    if (!isConfigured && countItems === 0) {
      await seedInitialInventoryIfEmpty();
    }
  } catch (e) {
    console.error('Database initialization error:', e);
  }
}

export async function clearAllDatabase() {
  await db.transaction('rw', [db.items, db.sales, db.vintedCatalog], async () => {
    await db.items.clear();
    await db.sales.clear();
    await db.vintedCatalog.clear();
  });
}
