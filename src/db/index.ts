import Dexie, { type Table } from 'dexie';
import { Item, Sale, VintedItem } from '../types';

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

// Load the 120 verified items from Rita's Vinted wardrobe
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

export async function initDatabase() {
  try {
    await db.open();
    const countVinted = await db.vintedCatalog.count();
    if (countVinted === 0) {
      await loadRealVintedDressing();
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
