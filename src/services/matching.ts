import { Item, VintedItem, MatchResult } from '../types';

export function cleanStr(s?: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

export function isCostSet(price: number | null | undefined): boolean {
  if (price === null || price === undefined || (price as any) === '') return false;
  const num = Number(price);
  return !isNaN(num) && num >= 0;
}

export function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('jacket') || t.includes('veste') || t.includes('blazer') || t.includes('bolero') || t.includes('coat') || t.includes('poncho') || t.includes('cape')) return "Jackets & Coats";
  if (t.includes('boots') || t.includes('heels') || t.includes('loafers') || t.includes('sneakers') || t.includes('chaussures')) return "Shoes & Boots";
  if (t.includes('dress') || t.includes('robe') || t.includes('suit') || t.includes('tailleur')) return "Dresses & Suits";
  if (t.includes('skirt') || t.includes('jupe') || t.includes('trousers') || t.includes('joggers') || t.includes('pantalon')) return "Skirts & Trousers";
  if (t.includes('cardigan') || t.includes('jumper') || t.includes('pull') || t.includes('hoodie')) return "Knitwear & Sweaters";
  if (t.includes('bag') || t.includes('sac')) return "Bags & Leather Goods";
  if (t.includes('gloves') || t.includes('gants') || t.includes('foulard') || t.includes('scarf') || t.includes('belt') || t.includes('ceinture') || t.includes('hat') || t.includes('chapeau')) return "Accessories";
  return "Tops & Shirts";
}

// Extract unique image identifier from Vinted photo URL (e.g. "c4152b67")
export function extractPhotoHash(url?: string): string {
  if (!url) return '';
  const m = url.match(/\/([a-f0-9]{8,})\.(?:jpeg|jpg|png)/i);
  return m ? m[1] : '';
}

const STOP_WORDS = new Set(['vintage', 'dressing', 'style', 'with', 'avec', 'the', 'size', 'taille', 'and', 'pour', 'femme', 'homme']);

/**
 * Robust, deterministic match between an internal item and a live Vinted item.
 * 1. Photo hash match (exact, 100% reliable)
 * 2. Exact clean title match
 * 3. High-precision clean title overlap (>= 80% significant words) with brand verification
 */
export function isSameVintedItem(
  stockItem: { title: string; brand?: string; photo?: string },
  vntItem: { title: string; brand?: string; photo?: string }
): boolean {
  // 1. Photo hash exact match
  const stockPhotoHash = extractPhotoHash(stockItem.photo);
  const vntPhotoHash = extractPhotoHash(vntItem.photo);
  if (stockPhotoHash && vntPhotoHash && stockPhotoHash === vntPhotoHash) {
    return true;
  }

  // 2. Exact clean title match
  const it = cleanStr(stockItem.title);
  const vt = cleanStr(vntItem.title);
  if (it && vt && it === vt) {
    return true;
  }

  // 3. High-precision clean title overlap (>= 80% words) with brand match
  if (it.length > 8 && vt.length > 8) {
    const iWords = it.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const vWords = vt.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    if (iWords.length > 0 && vWords.length > 0) {
      let matched = 0;
      for (const w of iWords) {
        if (vWords.includes(w)) matched++;
      }
      const overlap = matched / Math.max(iWords.length, vWords.length);
      if (overlap >= 0.8) {
        const sBrand = cleanStr(stockItem.brand);
        const vBrand = cleanStr(vntItem.brand);
        if (sBrand && vBrand && !STOP_WORDS.has(sBrand) && !STOP_WORDS.has(vBrand)) {
          if (sBrand === vBrand || it.includes(vBrand) || vt.includes(sBrand)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
  }

  return false;
}

export function smartMatch(piece: Item, vintedList: VintedItem[]): MatchResult {
  for (const v of vintedList) {
    if (isSameVintedItem(piece, v)) {
      return {
        matched: true,
        score: 100,
        vintedItem: v
      };
    }
  }

  return {
    matched: false,
    score: 0,
    vintedItem: null
  };
}

export function isVintedItemImported(vnt: VintedItem, items: Item[], sales: any[] = []): boolean {
  // 1. Check in active stock
  const inStock = items.some(i => isSameVintedItem(i, vnt));
  if (inStock) return true;

  // 2. Check in sales (already sold pieces)
  const inSales = (sales || []).some(s => isSameVintedItem(s, vnt));
  return inSales;
}
