import Dexie, { type Table } from 'dexie';
import { Item, Sale, VintedItem } from '../types';

export class RitaDatabase extends Dexie {
  items!: Table<Item, string>;
  sales!: Table<Sale, string>;
  vintedCatalog!: Table<VintedItem, string>;

  constructor() {
    super('RitaComptaDB');
    this.version(1).stores({
      items: 'id, brand, title, category, purchaseDate',
      sales: 'id, brand, channel, saleDate',
      vintedCatalog: 'id, brand, title'
    });
  }
}

export const db = new RitaDatabase();

// Chargement automatique des 120 vrais articles du dressing de Rita
export async function loadRealVintedDressing(): Promise<VintedItem[]> {
  try {
    const res = await fetch('/rita_vinted_dressing.json');
    if (!res.ok) return [];
    const items: VintedItem[] = await res.json();
    
    // Mettre à jour la table vintedCatalog atomiquement
    await db.transaction('rw', db.vintedCatalog, async () => {
      await db.vintedCatalog.clear();
      await db.vintedCatalog.bulkPut(items);
    });
    return items;
  } catch (err) {
    console.error('Erreur chargement dressing réel:', err);
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
    console.error('Erreur initialisation DB:', e);
  }
}

export async function clearAllDatabase() {
  await db.transaction('rw', [db.items, db.sales, db.vintedCatalog], async () => {
    await db.items.clear();
    await db.sales.clear();
    await db.vintedCatalog.clear();
  });
}
