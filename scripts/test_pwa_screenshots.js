import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testScreenshots() {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  
  // 1. Mobile Screenshot (iPhone 13 viewport)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Open install modal
  const installBtn = await mobilePage.$('button[title="Installer l\'application"]');
  if (installBtn) {
    await installBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }
  await mobilePage.screenshot({ path: path.resolve('scratch', 'pwa_install_mobile.png') });
  console.log('Mobile screenshot saved to scratch/pwa_install_mobile.png');

  // Close modal and open burger menu
  const closeBtn = await mobilePage.$('button.text-secondary.hover\\:text-primary');
  if (closeBtn) await closeBtn.click();
  await new Promise(r => setTimeout(r, 300));

  const burgerBtn = await mobilePage.$('button[aria-label="Menu de navigation"]');
  if (burgerBtn) {
    await burgerBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await mobilePage.screenshot({ path: path.resolve('scratch', 'burger_menu_with_install.png') });
    console.log('Burger menu screenshot saved to scratch/burger_menu_with_install.png');
  }

  // 2. Desktop Screenshot
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await desktopPage.screenshot({ path: path.resolve('scratch', 'desktop_view.png') });
  console.log('Desktop screenshot saved to scratch/desktop_view.png');

  await browser.close();
}

testScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
