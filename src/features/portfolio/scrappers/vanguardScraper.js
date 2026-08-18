// services/scrapers/vanguardScraper.js

import puppeteer from 'puppeteer';

export async function scrapeVanguardETF(symbol) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    const url = `https://investor.vanguard.com/investment-products/etfs/profile/${symbol.toLowerCase()}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extraer sectores
    const sectors = await page.evaluate(() => {
      const sectorRows = document.querySelectorAll('[data-testid="sector-breakdown"] tr');
      return Array.from(sectorRows).map((row) => {
        const [name, percent] = row.querySelectorAll('td');
        return {
          sectorName: name?.textContent?.trim(),
          weightPct: parseFloat(percent?.textContent?.replace('%', '') || '0'),
        };
      });
    });

    // Extraer holdings
    const holdings = await page.evaluate(() => {
      const holdingRows = document.querySelectorAll('[data-testid="top-holdings"] tr');
      return Array.from(holdingRows).map((row) => {
        const [symbol, name, percent] = row.querySelectorAll('td');
        return {
          symbol: symbol?.textContent?.trim(),
          name: name?.textContent?.trim(),
          weightPct: parseFloat(percent?.textContent?.replace('%', '') || '0'),
        };
      });
    });

    return { sectors, holdings };
  } finally {
    await browser.close();
  }
}