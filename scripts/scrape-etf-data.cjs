// scripts/scrape-etf-data.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ETF_SYMBOLS = ['VOO', 'VXUS', 'BND'];

const SECTOR_MAP = {
  'Technology': 'tecnologia',
  'Financial Services': 'finanzas',
  'Communication Services': 'comunicacion',
  'Consumer Cyclical': 'consumo_discrecional',
  'Healthcare': 'salud',
  'Industrials': 'industria',
  'Consumer Defensive': 'consumo_basico',
  'Energy': 'energia',
  'Real Estate': 'inmobiliario',
  'Utilities': 'servicios_publicos',
  'Basic Materials': 'materiales',
};

async function scrapeVanguardETF(browser, symbol) {
  const page = await browser.newPage();
  
  try {
    const url = `https://investor.vanguard.com/investment-products/etfs/profile/${symbol.toLowerCase()}`;
    console.log(`Scraping ${symbol} from ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Esperar a que cargue la sección de portfolio
    await page.waitForSelector('[data-testid*="portfolio"]', { timeout: 10000 })
      .catch(() => console.warn(`Timeout waiting for portfolio section for ${symbol}`));

    // Extraer sectores
    const sectors = await page.evaluate((sectorMap) => {
      const result = [];
      
      // Buscar tablas de sector breakdown
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const text = table.textContent.toLowerCase();
        if (text.includes('sector') && text.includes('breakdown')) {
          const rows = table.querySelectorAll('tr');
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const sectorName = cells[0].textContent.trim();
              const percentText = cells[1].textContent.replace('%', '').trim();
              const percent = parseFloat(percentText);
              
              if (!isNaN(percent) && percent > 0) {
                const normalizedSector = sectorMap[sectorName] || 
                  sectorName.toLowerCase().replace(/\s+/g, '_');
                
                result.push({
                  sector: normalizedSector,
                  weightPct: percent,
                  sourceStandard: 'GICS'
                });
              }
            }
          }
          break;
        }
      }
      
      return result;
    }, SECTOR_MAP);

    // Extraer holdings
    const holdings = await page.evaluate(() => {
      const result = [];
      
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const text = table.textContent.toLowerCase();
        if (text.includes('top') && text.includes('holding')) {
          const rows = table.querySelectorAll('tr');
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              const symbol = cells[0].textContent.trim();
              const name = cells[1]?.textContent?.trim() || '';
              const percentText = cells[2]?.textContent?.replace('%', '').trim() || '0';
              const percent = parseFloat(percentText);
              
              if (!isNaN(percent) && percent > 0 && symbol) {
                result.push({
                  symbol,
                  name,
                  weightPct: percent
                });
              }
            }
          }
          break;
        }
      }
      
      return result;
    });

    // Extraer fecha de datos
    const asOfDate = await page.evaluate(() => {
      const dateElement = document.querySelector('[data-testid*="as-of"], .as-of-date');
      if (dateElement) {
        const text = dateElement.textContent;
        const match = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (match) {
          const [month, day, year] = match[1].split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      return new Date().toISOString().slice(0, 10);
    });

    // Extraer expense ratio
    const expenseRatio = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const text = table.textContent.toLowerCase();
        if (text.includes('expense') && text.includes('ratio')) {
          const rows = table.querySelectorAll('tr');
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const label = cells[0].textContent.toLowerCase();
              if (label.includes('expense') && label.includes('ratio')) {
                const percentText = cells[1].textContent.replace('%', '').trim();
                return parseFloat(percentText) / 100;
              }
            }
          }
        }
      }
      return null;
    });

    return {
      symbol,
      issuer: 'vanguard',
      asOfDate: asOfDate || new Date().toISOString().slice(0, 10),
      source: 'vanguard_official',
      status: sectors.length > 0 ? 'complete' : 'partial',
      sectors,
      holdings: holdings.slice(0, 10), // Top 10 holdings
      expenseRatio,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error scraping ${symbol}:`, error);
    return {
      symbol,
      issuer: 'vanguard',
      asOfDate: new Date().toISOString().slice(0, 10),
      source: 'scrape_error',
      status: 'error',
      sectors: [],
      holdings: [],
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Starting ETF data scraper...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const results = {};
    
    for (const symbol of ETF_SYMBOLS) {
      const data = await scrapeVanguardETF(browser, symbol);
      results[symbol] = data;
      console.log(`✓ ${symbol}: ${data.status} (${data.sectors.length} sectors)`);
    }

    // Leer datos existentes para mantener histórico
    const existingDataPath = path.join(__dirname, '..', 'public', 'data', 'etf-exposure.json');
    let existingData = { lastUpdated: null, etfs: {} };
    
    try {
      const existingContent = fs.readFileSync(existingDataPath, 'utf8');
      existingData = JSON.parse(existingContent);
    } catch (e) {
      console.log('No existing data file found, creating new one');
    }

    // Crear nuevo archivo
    const outputData = {
      lastUpdated: new Date().toISOString(),
      etfs: {
        ...existingData.etfs,
        ...results
      }
    };

    // Escribir archivo
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'etf-exposure.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log(`\n✓ Data written to ${outputPath}`);
    console.log(`  Last updated: ${outputData.lastUpdated}`);
    console.log(`  ETFs: ${Object.keys(outputData.etfs).join(', ')}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);