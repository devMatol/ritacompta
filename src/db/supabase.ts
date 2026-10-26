import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Item, Sale, VintedItem } from '../types';

// Default live Supabase credentials for Kozha (Organization: LumisWeb, Paris eu-west-3)
const DEFAULT_SUPABASE_URL = 'https://sxyygtonjhywltoieegd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eXlndG9uamh5d2x0b2llZWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTA5ODIsImV4cCI6MjEwODUyNjk4Mn0.UW4Q-5s_ejiAUiPDvFP-a14P5-Jv-BYudOK8mdNH754';

// Read config from Vite env, localStorage override, or default project
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('kozha_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('kozha_supabase_key') || '' : '';

  const url = localUrl || envUrl || DEFAULT_SUPABASE_URL;
  const key = localKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  return { url, key, isConfigured: Boolean(url && key) };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kozha_supabase_url', url.trim());
    localStorage.setItem('kozha_supabase_key', key.trim());
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kozha_supabase_url');
    localStorage.removeItem('kozha_supabase_key');
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseInstance;
}

// Convert DB snake_case to Item
function rowToItem(row: any): Item {
  const hasCost = row.purchase_price !== null && row.purchase_price !== undefined && row.purchase_price !== '';
  const numPrice = hasCost ? Number(row.purchase_price) : null;
  const isExplicit = row.cost_explicitly_set !== undefined
    ? Boolean(row.cost_explicitly_set)
    : (numPrice !== null && !isNaN(numPrice));

  return {
    id: row.id,
    brand: row.brand,
    title: row.title,
    category: row.category,
    size: row.size || '',
    source: row.source || 'Flea Market',
    purchasePrice: numPrice,
    targetPrice: Number(row.target_price) || 0,
    photo: row.photo || '',
    purchaseDate: row.purchase_date || '',
    vintedId: row.vinted_id,
    costExplicitlySet: isExplicit
  };
}

// Convert Item to DB snake_case
function itemToRow(item: Item) {
  let priceToSave: number | null = null;
  if (item.purchasePrice !== null && item.purchasePrice !== undefined) {
    if (item.purchasePrice > 0) {
      priceToSave = item.purchasePrice;
    } else if (item.purchasePrice === 0) {
      priceToSave = item.costExplicitlySet ? 0 : null;
    }
  }

  return {
    id: item.id,
    brand: item.brand,
    title: item.title,
    category: item.category,
    size: item.size,
    source: item.source,
    purchase_price: priceToSave,
    target_price: item.targetPrice,
    photo: item.photo,
    purchase_date: item.purchaseDate,
    vinted_id: item.vintedId
  };
}

// Convert DB snake_case to Sale
function rowToSale(row: any): Sale {
  return {
    id: row.id,
    itemId: row.item_id,
    brand: row.brand,
    title: row.title,
    channel: row.channel,
    salePrice: Number(row.sale_price) || 0,
    purchasePrice: Number(row.purchase_price) || 0,
    photo: row.photo || '',
    saleDate: row.sale_date,
    purchaseDate: row.purchase_date,
    paymentMethod: row.payment_method
  };
}

// Convert Sale to DB snake_case
function saleToRow(sale: Sale) {
  return {
    id: sale.id,
    item_id: sale.itemId,
    brand: sale.brand,
    title: sale.title,
    channel: sale.channel,
    sale_price: sale.salePrice,
    purchase_price: sale.purchasePrice,
    photo: sale.photo,
    sale_date: sale.saleDate,
    purchase_date: sale.purchaseDate,
    payment_method: sale.paymentMethod
  };
}

// API methods
export async function cloudFetchItems(): Promise<Item[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('items').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching items from cloud:', error);
    return null;
  }
  return (data || []).map(rowToItem);
}

export async function cloudAddItem(item: Item): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('items').upsert(itemToRow(item));
  if (error) {
    console.error('Error adding item to cloud:', error);
    return false;
  }
  return true;
}

export async function cloudBulkAddItems(items: Item[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const rows = items.map(itemToRow);
  const { error } = await client.from('items').upsert(rows);
  if (error) {
    console.error('Error bulk adding items to cloud:', error);
    return false;
  }
  return true;
}

export async function cloudUpdateItemPrice(itemId: string, newPrice: number | null): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('items').update({ purchase_price: newPrice }).eq('id', itemId);
  if (error) {
    console.error('Error updating price in cloud:', error);
    return false;
  }
  return true;
}

export async function cloudDeleteItem(itemId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('items').delete().eq('id', itemId);
  if (error) {
    console.error('Error deleting item from cloud:', error);
    return false;
  }
  return true;
}

export async function cloudFetchSales(): Promise<Sale[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('sales').select('*').order('sale_date', { ascending: false });
  if (error) {
    console.error('Error fetching sales from cloud:', error);
    return null;
  }
  return (data || []).map(rowToSale);
}

export async function cloudAddSale(sale: Sale): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('sales').insert(saleToRow(sale));
  if (error) {
    console.error('Error recording sale in cloud:', error);
    return false;
  }
  return true;
}

export async function cloudFetchVintedCatalog(): Promise<VintedItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('vinted_catalog').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching Vinted catalog from cloud:', error);
    return null;
  }
  return (data || []).map(r => ({
    id: r.id,
    title: r.title,
    brand: r.brand,
    condition: r.condition,
    size: r.size,
    price: Number(r.price),
    photo: r.photo,
    url: r.url
  }));
}

export async function cloudSeedVintedCatalog(items: VintedItem[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const rows = items.map(v => ({
    id: v.id,
    title: v.title,
    brand: v.brand,
    condition: v.condition,
    size: v.size,
    price: v.price,
    photo: v.photo,
    url: v.url
  }));
  const { error } = await client.from('vinted_catalog').upsert(rows);
  if (error) {
    console.error('Error seeding Vinted catalog in cloud:', error);
    return false;
  }
  return true;
}
