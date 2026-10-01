// scripts/fetch-etf-data.cjs
// Alternativa robusta al scraper de Puppeteer.
// Soporta múltiples fuentes: Vanguard (API interna) + iShares (API pública).

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Configuración de ETFs
// ─────────────────────────────────────────────────────────────

const ETF_CONFIG = [
  {
    symbol: 'VOO',
    source: 'vanguard',
    cusip: '922908363',
  },
  {
    symbol: 'VXUS',
    source: 'vanguard',
    cusip: '921909768',
  },
  {
    symbol: 'BND',
    source: 'vanguard',
    cusip: '921937835',
  },
  {
    symbol: 'VTI',
    source: 'vanguard',
    cusip: '922908769',
  },
  {
    symbol: 'EMXC',
    source: 'ishares',
    productId: '273590',
  },
  {
    symbol: 'IAU',
    source: 'ishares',
    productId: '239560',
  },
  {
    symbol: 'SLV',
    source: 'ishares',
    productId: '239855',
  },
];

// ─────────────────────────────────────────────────────────────
// Mapeo de sectores estándar → interno
// ─────────────────────────────────────────────────────────────

const SECTOR_MAP = {
  // Vanguard / GICS
  'Technology': 'tecnologia',
  'Information Technology': 'tecnologia',
  'Financial Services': 'finanzas',
  'Financials': 'finanzas',
  'Communication Services': 'comunicacion',
  'Consumer Cyclical': 'consumo_discrecional',
  'Consumer Discretionary': 'consumo_discrecional',
  'Healthcare': 'salud',
  'Health Care': 'salud',
  'Industrials': 'industria',
  'Consumer Defensive': 'consumo_basico',
  'Consumer Staples': 'consumo_basico',
  'Energy': 'energia',
  'Real Estate': 'inmobiliario',
  'Utilities': 'servicios_publicos',
  'Basic Materials': 'materiales',
  'Materials': 'materiales',
};

function normalizeSectorName(name) {
  const trimmed = String(name || '').trim();
  return (
    SECTOR_MAP[trimmed] ||
    trimmed.toLowerCase().replace(/\s+/g, '_')
  );
}

// ─────────────────────────────────────────────────────────────
// VANGUARD
// ─────────────────────────────────────────────────────────────

async function fetchVanguardPortfolio(cusip) {
  const url =
    `https://api.vanguard.com/rs/ire/01/profile/fund/${cusip}/portfolio`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Vanguard API ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

function normalizeVanguardHoldings(rawHoldings = []) {
  return rawHoldings
    .slice(0, 10)
    .map((h) => ({
      symbol: String(h.ticker || h.symbol || '').toUpperCase(),
      name: String(h.holdingName || h.name || '').trim(),
      weightPct: Number(h.percentOfFund || h.weight || 0),
      sector: h.sector ? normalizeSectorName(h.sector) : null,
    }))
    .filter((h) => h.symbol && h.weightPct > 0);
}

function normalizeVanguardSectors(rawSectors = []) {
  return rawSectors
    .map((s) => {
      const rawName = String(s.sector || s.name || '').trim();

      return {
        sector: normalizeSectorName(rawName),
        weightPct: Number(s.percentOfFund || s.weight || 0),
        sourceStandard: 'GICS',
      };
    })
    .filter((s) => s.weightPct > 0);
}

async function fetchFromVanguard(config) {
  try {
    const data = await fetchVanguardPortfolio(config.cusip);

    const holdings = normalizeVanguardHoldings(
      data?.portfolio?.holdings || data?.holdings || [],
    );

    const sectors = normalizeVanguardSectors(
      data?.portfolio?.sectors || data?.sectors || [],
    );

    return {
      symbol: config.symbol,
      issuer: 'vanguard',
      asOfDate:
        data?.asOfDate ||
        data?.portfolio?.asOfDate ||
        new Date().toISOString().slice(0, 10),
      source: 'vanguard_api',
      status:
        holdings.length > 0 || sectors.length > 0
          ? 'complete'
          : 'partial',
      holdings,
      sectors,
      expenseRatio: Number(data?.expenseRatio || 0) || null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[Vanguard] Error fetching ${config.symbol}:`,
      error.message,
    );

    return {
      symbol: config.symbol,
      issuer: 'vanguard',
      asOfDate: new Date().toISOString().slice(0, 10),
      source: 'vanguard_api_error',
      status: 'error',
      holdings: [],
      sectors: [],
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// iSHARES
// ─────────────────────────────────────────────────────────────

async function fetchIsharesPortfolio(productId) {
  // Endpoint AJAX usado por el sitio de iShares.
  // Devuelve un JSON con holdings + sectores + info del fondo.
  const url =
    `https://www.ishares.com/us/products/${productId}/` +
    `1467271812596.ajax?fileType=json&tab=all`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(
      `iShares API ${response.status}: ${response.statusText}`,
    );
  }

  const text = await response.text();

  // iShares a veces devuelve el JSON con prefijo anti-CSRF.
  // Buscar el primer '{' y parsear desde ahí.
  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) {
    throw new Error('iShares returned non-JSON response');
  }

  return JSON.parse(text.slice(jsonStart));
}

function normalizeIsharesHoldings(raw = []) {
  return raw
    .slice(0, 10)
    .map((h) => ({
      symbol: String(
        h.ticker || h.symbol || h.holdingTicker || '',
      ).toUpperCase(),
      name: String(
        h.name || h.holdingName || h.securityName || '',
      ).trim(),
      weightPct: Number(
        h.weight || h.percentOfFund || h.percentage || 0,
      ),
      sector: h.sector
        ? normalizeSectorName(h.sector)
        : null,
    }))
    .filter((h) => h.symbol && h.weightPct > 0);
}

function normalizeIsharesSectors(raw = []) {
  return raw
    .map((s) => {
      const rawName = String(
        s.sector || s.name || '',
      ).trim();

      return {
        sector: normalizeSectorName(rawName),
        weightPct: Number(
          s.weight || s.percentOfFund || s.percentage || 0,
        ),
        sourceStandard: 'GICS',
      };
    })
    .filter((s) => s.weightPct > 0);
}

async function fetchFromIshares(config) {
  try {
    const data = await fetchIsharesPortfolio(config.productId);

    // iShares puede devolver distintas keys según el endpoint.
    // Intentamos múltiples paths.
    const rawHoldings =
      data?.holdings ||
      data?.fundHoldings ||
      data?.portfolio?.holdings ||
      [];

    const rawSectors =
      data?.sectors ||
      data?.sectorBreakdown ||
      data?.portfolio?.sectors ||
      [];

    const holdings = normalizeIsharesHoldings(rawHoldings);
    const sectors = normalizeIsharesSectors(rawSectors);

    return {
      symbol: config.symbol,
      issuer: 'ishares',
      asOfDate:
        data?.asOfDate ||
        data?.fundInfo?.asOfDate ||
        new Date().toISOString().slice(0, 10),
      source: 'ishares_api',
      status:
        holdings.length > 0 || sectors.length > 0
          ? 'complete'
          : 'partial',
      holdings,
      sectors,
      expenseRatio:
        Number(
          data?.expenseRatio ||
          data?.fundInfo?.expenseRatio ||
          0,
        ) || null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[iShares] Error fetching ${config.symbol}:`,
      error.message,
    );

    return {
      symbol: config.symbol,
      issuer: 'ishares',
      asOfDate: new Date().toISOString().slice(0, 10),
      source: 'ishares_api_error',
      status: 'error',
      holdings: [],
      sectors: [],
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────

async function fetchEtfData(config) {
  if (config.source === 'vanguard') {
    return fetchFromVanguard(config);
  }

  if (config.source === 'ishares') {
    return fetchFromIshares(config);
  }

  console.warn(
    `Unknown source "${config.source}" for ${config.symbol}`,
  );

  return {
    symbol: config.symbol,
    issuer: config.source,
    asOfDate: new Date().toISOString().slice(0, 10),
    source: 'unknown_source',
    status: 'error',
    holdings: [],
    sectors: [],
    error: `Unknown source: ${config.source}`,
    scrapedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching ETF data...\n');

  const results = {};

  for (const config of ETF_CONFIG) {
    const data = await fetchEtfData(config);
    results[config.symbol] = data;

    console.log(
      `✓ ${config.symbol.padEnd(6)} [${config.source.padEnd(9)}] ` +
      `${data.status.padEnd(9)} ` +
      `(${data.holdings.length} holdings, ${data.sectors.length} sectors)`,
    );
  }

  const outputPath = path.join(
    __dirname,
    '..',
    'public',
    'data',
    'etf-exposure.json',
  );

  let existingData = { lastUpdated: null, etfs: {} };

  try {
    const existingContent = fs.readFileSync(
      outputPath,
      'utf8',
    );
    existingData = JSON.parse(existingContent);
  } catch (e) {
    console.log(
      '\nNo existing data file found, creating new one',
    );
  }

  // Preservar ETFs que NO están en ETF_CONFIG (por si tienes otros manuales)
  const mergedEtfs = {
    ...existingData.etfs,
    ...results,
  };

  // Eliminar entradas con status 'error' que además estén vacías,
  // pero solo si el JSON existente tenía datos buenos para ese símbolo.
  for (const [symbol, data] of Object.entries(results)) {
    if (
      data.status === 'error' &&
      existingData.etfs?.[symbol] &&
      (existingData.etfs[symbol].holdings?.length > 0 ||
        existingData.etfs[symbol].sectors?.length > 0)
    ) {
      console.log(
        `⚠ ${symbol}: preservando datos previos (fetch falló)`,
      );

      mergedEtfs[symbol] = existingData.etfs[symbol];
    }
  }

  const outputData = {
    lastUpdated: new Date().toISOString(),
    etfs: mergedEtfs,
  };

  fs.writeFileSync(
    outputPath,
    JSON.stringify(outputData, null, 2),
    'utf8',
  );

  console.log(`\n✓ Data written to ${outputPath}`);
  console.log(`  Last updated: ${outputData.lastUpdated}`);
  console.log(
    `  ETFs (${Object.keys(outputData.etfs).length}): ` +
    `${Object.keys(outputData.etfs).join(', ')}`,
  );

  // Reporte de errores
  const errors = Object.entries(results).filter(
    ([, data]) => data.status === 'error',
  );

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} ETF(s) fallaron:`);
    errors.forEach(([symbol, data]) => {
      console.log(`   ${symbol}: ${data.error}`);
    });
  }
}

main().catch(console.error);