import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testDashboardZero() {
  const b = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const p = await b.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click Sales Dashboard tab
  const tabs = await p.$$('nav button');
  for (const t of tabs) {
    const text = await t.evaluate(el => el.innerText);
    if (text.includes('Sales Dashboard')) {
      await t.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 400));

  const textContent = (await p.evaluate(() => document.body.innerText)).toUpperCase();
  console.log('Contains TOTAL REVENUE:', textContent.includes('TOTAL REVENUE'));
  console.log('Contains NET PROFIT:', textContent.includes('NET PROFIT'));
  console.log('Contains SALES CHANNEL COMPARISON:', textContent.includes('SALES CHANNEL COMPARISON'));
  console.log('Contains DETAILED SALES LEDGER:', textContent.includes('DETAILED SALES LEDGER'));

  await b.close();
}

testDashboardZero().catch(console.error);
