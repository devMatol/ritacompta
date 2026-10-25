import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_URL = 'https://www.vinted.fr/member/68815764-nuzhdinari';

async function scrapeAllDressing() {
  console.log('🚀 Démarrage pour extraire l\'INTÉGRALITÉ des 120 articles de Rita...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1280, height: 900 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();
  
  await page.goto(PROFILE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const cookieBtn = await page.$('#onetrust-accept-btn-handler');
    if (cookieBtn) await cookieBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {}

  console.log('📜 Défilement progressif du dressing...');
  let totalCards = 0;
  let stagnantCount = 0;

  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1500));

    // Vérifier si un bouton "Charger plus" existe
    try {
      const loadMoreBtn = await page.$('button[data-testid*="catalog-load-more"]');
      if (loadMoreBtn) {
        console.log('   Bouton "Charger plus" cliqué...');
        await loadMoreBtn.click();
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (e) {}

    const count = await page.evaluate(() => document.querySelectorAll('[data-testid^="product-item-id-"]').length);
    console.log(`   ${count} articles chargés...`);

    if (count === totalCards) {
      stagnantCount++;
      if (stagnantCount >= 4) {
        console.log('   Fin du dressing atteinte.');
        break;
      }
    } else {
      stagnantCount = 0;
      totalCards = count;
    }
  }

  // Scroll back to top to ensure all images load
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  console.log('✨ Extraction des 120 fiches articles...');

  const items = await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const cards = document.querySelectorAll('[data-testid^="product-item-id-"]');

    cards.forEach((card) => {
      const testId = card.getAttribute('data-testid') || '';
      const idMatch = testId.match(/product-item-id-(\d+)$/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (seen.has(id)) return;
      seen.add(id);

      const link = card.querySelector('a[href*="/items/"]');
      const href = link?.getAttribute('href') || `/items/${id}`;
      const titleAttr = link?.getAttribute('title') || '';
      
      const img = card.querySelector(`[data-testid="product-item-id-${id}--image"] img`) || card.querySelector('img');
      const photo = img?.getAttribute('src') || '';
      const alt = img?.getAttribute('alt') || titleAttr || '';

      let title = '';
      let brand = 'Vintage';
      let size = 'M';
      let condition = 'Très bon état';
      let price = 0;

      if (alt.includes('marque:') || alt.includes('frais Vinted')) {
        const parts = alt.split(', ');
        title = parts[0] || '';
        for (const p of parts) {
          if (p.startsWith('marque:')) brand = p.replace('marque:', '').trim();
          else if (p.startsWith('état:')) condition = p.replace('état:', '').trim();
          else if (p.startsWith('taille:')) size = p.replace('taille:', '').trim();
          else if (p.includes('€') && !p.includes('frais')) {
            const pMatch = p.match(/([0-9]+(?:,[0-9]{2})?)/);
            if (pMatch && price === 0) price = parseFloat(pMatch[1].replace(',', '.'));
          }
        }
      } else {
        title = titleAttr || 'Article de Rita';
      }

      if (price === 0) {
        const text = card.textContent || '';
        const pMatch = text.match(/([0-9]+(?:,[0-9]{2})?)\s*€/);
        if (pMatch) price = parseFloat(pMatch[1].replace(',', '.'));
      }

      if (title) {
        results.push({
          id,
          title,
          brand,
          size,
          condition,
          price: price || 20,
          photo,
          url: `https://www.vinted.fr${href}`
        });
      }
    });

    return results;
  });

  console.log(`✅ TOTAL RÉEL EXTRAIT : ${items.length} articles !`);

  const outPathPublic = path.resolve('public', 'rita_vinted_dressing.json');
  fs.mkdirSync(path.dirname(outPathPublic), { recursive: true });
  fs.writeFileSync(outPathPublic, JSON.stringify(items, null, 2), 'utf8');

  await browser.close();
  console.log('🎉 Sauvegarde terminée dans public/rita_vinted_dressing.json !');
}

scrapeAllDressing().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
