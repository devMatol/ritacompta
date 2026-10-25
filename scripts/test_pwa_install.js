import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();
  
  // Mobile test
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const title = await page.title();
  const installBtn = await page.$('button[title="Installer l\'application"]');
  console.log('Page title:', title);
  console.log('Mobile install button found:', !!installBtn);

  if (installBtn) {
    await installBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const modalTitle = await page.evaluate(() => document.querySelector('h3')?.innerText);
    console.log('Modal opened with title:', modalTitle);
  }

  // Check manifest link
  const manifestHref = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute('href'));
  console.log('Manifest link href:', manifestHref);

  // Check service worker
  const swRegistered = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    }
    return false;
  });
  console.log('Service Worker registered:', swRegistered);

  await browser.close();
  console.log('Test completed successfully!');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
