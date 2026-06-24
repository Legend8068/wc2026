import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log("Navigating...");
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
