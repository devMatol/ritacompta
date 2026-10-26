import Dexie, { type Table } from 'dexie';
import { Item, Sale, VintedItem } from '../types';
import { guessCategory } from '../services/matching';

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

// Load the 120 verified items from Rita's Vinted wardrobe into vintedCatalog
export async function loadRealVintedDressing(): Promise<VintedItem[]> {
  try {
    const res = await fetch('/rita_vinted_dressing.json');
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
      purchaseDate: new Date().toISOString().split('T')[0],
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

    const countItems = await db.items.count();
    if (countItems === 0) {
      await seedInitialInventoryIfEmpty();
    } else {
      // Migrate initial seeded dressing items that were set to 0 by default into null (needs cost)
      if (typeof window !== 'undefined' && !localStorage.getItem('kozha_unset_seed_costs_v1')) {
        const allItems = await db.items.toArray();
        const updates: Item[] = [];
        for (const item of allItems) {
          if (item.source === 'Vinted Dressing' && !item.costExplicitlySet && item.purchasePrice === 0) {
            updates.push({ ...item, purchasePrice: null, costExplicitlySet: false });
          }
        }
        if (updates.length > 0) {
          await db.items.bulkPut(updates);
        }
        localStorage.setItem('kozha_unset_seed_costs_v1', 'true');
      }
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
