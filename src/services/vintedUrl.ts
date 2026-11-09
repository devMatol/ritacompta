import { VintedItem } from '../types';

export interface VintedUrlResolution {
  url: string;
  isDirect: boolean;
}

export function resolveVintedUrl(
  entity: {
    url?: string;
    vintedId?: string;
    id?: string;
    itemId?: string;
    brand?: string;
    title?: string;
  },
  vintedCatalog?: VintedItem[]
): VintedUrlResolution {
  // 1. Direct url if already given
  if (entity.url && entity.url.startsWith('http')) {
    return { url: entity.url, isDirect: true };
  }

  // 2. Direct vintedId or numeric id
  const vid = entity.vintedId || (/^\d{5,}$/.test(entity.id || '') ? entity.id : undefined);
  if (vid) {
    return { url: `https://www.vinted.fr/items/${vid}`, isDirect: true };
  }

  // 3. Search by matching id or title in vintedCatalog
  if (vintedCatalog && vintedCatalog.length > 0) {
    const found = vintedCatalog.find(v => {
      if (v.id === entity.id || v.id === entity.vintedId || v.id === entity.itemId) return true;
      if (
        entity.title &&
        v.title &&
        entity.title.trim().toLowerCase() === v.title.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
    if (found) {
      return {
        url: found.url || `https://www.vinted.fr/items/${found.id}`,
        isDirect: true
      };
    }
  }

  // 4. Fallback search query on Vinted
  const query = [entity.brand, entity.title].filter(Boolean).join(' ').trim();
  if (query) {
    return {
      url: `https://www.vinted.fr/vetements?search_text=${encodeURIComponent(query)}`,
      isDirect: false
    };
  }

  // 5. Default Rita's dressing page
  return {
    url: 'https://www.vinted.fr/member/68815764-nuzhdinari',
    isDirect: false
  };
}
