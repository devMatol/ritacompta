import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sxyygtonjhywltoieegd.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eXlndG9uamh5d2x0b2llZWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTA5ODIsImV4cCI6MjEwODUyNjk4Mn0.UW4Q-5s_ejiAUiPDvFP-a14P5-Jv-BYudOK8mdNH754';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// In-memory cache to prevent hitting Vinted multiple times within seconds
let cache = {
  timestamp: 0,
  data: null
};

export async function scrapeLiveVinted(userId = '68815764') {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // 1. Visit homepage to initialize basic session cookies
  const cookieMap = new Map();
  try {
    const homeRes = await fetch('https://www.vinted.fr', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9'
      }
    });
    const homeCookies = homeRes.headers.getSetCookie ? homeRes.headers.getSetCookie() : [];
    homeCookies.forEach(c => {
      const [part] = c.split(';');
      const [k, ...v] = part.split('=');
      if (k && v.length > 0) cookieMap.set(k.trim(), v.join('='));
    });
  } catch (e) {
    console.warn('Vinted home fetch warning:', e);
  }

  // 2. Visit member page to get fresh OAuth access_token_web
  const memberUrl = `https://www.vinted.fr/member/${userId}-nuzhdinari`;
  const memberRes = await fetch(memberUrl, {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Cookie': Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
    }
  });

  const memberCookies = memberRes.headers.getSetCookie ? memberRes.headers.getSetCookie() : [];
  memberCookies.forEach(c => {
    const [part] = c.split(';');
    const [k, ...v] = part.split('=');
    if (k && v.length > 0) cookieMap.set(k.trim(), v.join('='));
  });

  const cookieHeader = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  const accessToken = cookieMap.get('access_token_web');

  // 3. Fetch all pages of wardrobe with 200ms spacing
  let allRawItems = [];
  let page = 1;
  while (page <= 15) {
    try {
      const apiRes = await fetch(`https://www.vinted.fr/api/v2/wardrobe/${userId}/items?page=${page}&per_page=20`, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Referer': memberUrl,
          'Cookie': cookieHeader,
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      });

      if (!apiRes.ok) break;
      const contentType = apiRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) break;

      const data = await apiRes.json();
      const items = data.items || [];
      if (items.length === 0) break;
      allRawItems.push(...items);
      if (items.length < 20) break;
      page++;

      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.warn(`Error on wardrobe page ${page}:`, e);
      break;
    }
  }

  // If live fetch returned nothing, fallback to Supabase table
  if (allRawItems.length === 0) {
    const { data: dbItems } = await client.from('vinted_catalog').select('*');
    if (dbItems && dbItems.length > 0) {
      return dbItems.map(d => ({
        ...d,
        publishedDate: d.published_date || d.publishedDate || '2026-09-01'
      }));
    }
    throw new Error('No items returned from Vinted API and DB fallback empty');
  }

  // 4. Format items
  return allRawItems.map(i => {
    let priceNum = 20;
    if (i.price && typeof i.price === 'object') {
      priceNum = parseFloat(i.price.amount) || 20;
    } else if (i.price) {
      priceNum = parseFloat(i.price) || 20;
    }

    const photoUrl = (i.photos && i.photos.length > 0)
      ? (i.photos[0].url || i.photos[0].full_size_url || '')
      : '';

    const ts = i.photos?.[0]?.high_resolution?.timestamp;
    const pubDate = ts ? new Date(ts * 1000).toISOString().split('T')[0] : '2026-09-01';

    return {
      id: String(i.id),
      title: i.title || '',
      brand: (typeof i.brand === 'string' ? i.brand : i.brand?.title) || i.brand_title || 'Vintage',
      condition: (typeof i.status === 'string' ? i.status : i.status?.title) || 'Très bon état',
      size: (typeof i.size === 'string' ? i.size : i.size?.title) || i.size_title || 'M',
      price: priceNum,
      photo: photoUrl,
      url: `https://www.vinted.fr/items/${i.id}`,
      publishedDate: pubDate
    };
  });
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = req.query?.user_id || '68815764';
  const force = req.query?.force === 'true' || req.query?.force === '1';

  // Return cached result if fetched less than 30s ago (unless force=true)
  const now = Date.now();
  if (!force && cache.data && (now - cache.timestamp < 30000)) {
    return res.status(200).json({
      success: true,
      count: cache.data.length,
      cached: true,
      items: cache.data
    });
  }

  try {
    const formatted = await scrapeLiveVinted(userId);

    // Save to cache
    cache = {
      timestamp: now,
      data: formatted
    };

    // Synchronize Supabase vinted_catalog table
    try {
      const liveIds = new Set(formatted.map(f => f.id));
      const { data: currentRows } = await client.from('vinted_catalog').select('id');
      if (currentRows && currentRows.length > 0) {
        const removedIds = currentRows.filter(r => !liveIds.has(String(r.id))).map(r => r.id);
        if (removedIds.length > 0) {
          await client.from('vinted_catalog').delete().in('id', removedIds);
        }
      }

      const rowsToUpsert = formatted.map(f => ({
        id: f.id,
        title: f.title,
        brand: f.brand,
        condition: f.condition,
        size: f.size,
        price: f.price,
        photo: f.photo,
        url: f.url
      }));
      await client.from('vinted_catalog').upsert(rowsToUpsert);
    } catch (dbErr) {
      console.warn('Supabase sync warning in vinted-sync:', dbErr);
    }

    return res.status(200).json({
      success: true,
      count: formatted.length,
      cached: false,
      items: formatted
    });
  } catch (error) {
    console.error('Error in vinted-sync handler:', error);
    return res.status(500).json({
      success: false,
      error: String(error)
    });
  }
}
