import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const b = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait for React to mount
  await p.waitForSelector('button[aria-label="Menu de navigation"]', { timeout: 5000 });
  await p.click('button[aria-label="Menu de navigation"]');
  await new Promise(r => setTimeout(r, 400));
  
  const navTexts = await p.evaluate(() => Array.from(document.querySelectorAll('nav')).map(n => n.innerText));
  console.log('Navs rendered:', navTexts);

  await p.screenshot({ path: 'scratch/burger_menu_open.png' });
  console.log('Saved scratch/burger_menu_open.png');

  await b.close();
}

main().catch(console.error);
