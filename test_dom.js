import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  console.log("Navigating...");
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
  
  const loading = await page.$('.loader');
  console.log("Loader exists?", !!loading);

  const hero = await page.$('.hero');
  console.log("Hero exists?", !!hero);

  const text = await page.evaluate(() => document.body.innerText);
  console.log("Text length:", text.length);

  await browser.close();
})();
