import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function generateIcons() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true
  });
  const page = await browser.newPage();
  
  const svgPath = path.resolve('public', 'icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; background: transparent;">
        ${svgContent}
      </body>
    </html>
  `);

  // Generate 512x512
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.screenshot({ path: path.resolve('public', 'icon-512.png'), omitBackground: false });

  // Generate 192x192
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  const svgEl = await page.$('svg');
  if (svgEl) {
    await svgEl.evaluate(el => {
      el.setAttribute('width', '192');
      el.setAttribute('height', '192');
    });
  }
  await page.screenshot({ path: path.resolve('public', 'icon-192.png'), omitBackground: false });

  await browser.close();
  console.log('PNG icons created successfully: icon-192.png, icon-512.png');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
