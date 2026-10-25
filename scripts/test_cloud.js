import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testCloud() {
  const b = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const p = await b.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const cloudBtn = await p.$('button[title="Click to configure live Supabase synchronization"]');
  if (cloudBtn) {
    await cloudBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const h3s = await p.evaluate(() => Array.from(document.querySelectorAll('h3')).map(h => h.innerText));
    console.log('H3 elements after opening modal:', h3s);
  }

  await b.close();
}

testCloud().catch(console.error);
