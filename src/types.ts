export interface Item {
  id: string;
  brand: string;
  title: string;
  category: string;
  size: string;
  source: 'Flea Market' | 'Vinted' | 'Consignment' | 'Private Seller' | string;
  purchasePrice: number;
  targetPrice: number;
  photo?: string;
  purchaseDate: string;
  vintedId?: string;
}

export interface Sale {
  id: string;
  itemId?: string;
  brand: string;
  title: string;
  channel: 'Vinted' | 'Flea Market' | 'Direct' | 'Instagram' | string;
  salePrice: number;
  purchasePrice: number;
  photo?: string;
  saleDate: string;
  purchaseDate: string;
  paymentMethod?: string;
}

export interface VintedItem {
  id: string;
  title: string;
  brand: string;
  condition: string;
  size: string;
  price: number;
  photo: string;
  url?: string;
  raw?: string;
}

export interface MatchResult {
  matched: boolean;
  score: number;
  vintedItem: VintedItem | null;
}

export interface BrandStat {
  name: string;
  count: number;
  margin: number;
  totalDays: number;
  avgDays: number;
}
