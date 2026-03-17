#!/usr/bin/env node
/**
 * migrate-transactions.mjs
 * Ejecutar: node migrate-transactions.mjs
 * Requiere: npm install firebase-admin xlsx
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

// ── Config ────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json'; // Descárgalo de Firebase Console
const USER_UID             = 'joel5vega@gmail.com';              // Firebase Auth UID del usuario
// ─────────────────────────────────────────────────────────

const saRaw = await readFile(SERVICE_ACCOUNT_PATH, 'utf8');
const sa    = JSON.parse(saRaw);
// Fix: algunos editores guardan \n literal en private_key
if (sa.private_key) {
  sa.private_key = sa.private_key.replace(/\\n/g, '\n');
}
initializeApp({
  credential: cert(sa),
  databaseURL: `https://${sa.project_id}-default-rtdb.firebaseio.com`,
  projectId: sa.project_id,
});
const db  = getFirestore();
const col = db.collection('users').doc(USER_UID).collection('transactions');

// ── Mapeo de categorías del XLSX → nuevo sistema ──────────
const CATEGORY_MAP = {
  // Necesidades familiares → hogar
  'víveres':         { category: 'viveres',    parent: 'hogar'      },
  '🍏 víveres':      { category: 'viveres',    parent: 'hogar'      },
  'comprar comida':  { category: 'viveres',    parent: 'hogar'      },
  '⚡light':         { category: 'servicios',  parent: 'hogar'      },
  '💧 water':        { category: 'servicios',  parent: 'hogar'      },
  '🌐 internet':     { category: 'servicios',  parent: 'hogar'      },
  'gas':             { category: 'servicios',  parent: 'hogar'      },
  '📞 phone':        { category: 'telefono',   parent: 'hogar'      },
  '🚌 transporte':   { category: 'transporte', parent: 'hogar'      },
  '🚡 teleférico':   { category: 'transporte', parent: 'hogar'      },
  'transport':       { category: 'transporte', parent: 'hogar'      },
  '🥼 health':       { category: 'salud',      parent: 'hogar'      },
  'health':          { category: 'salud',      parent: 'hogar'      },
  'hospital':        { category: 'salud',      parent: 'hogar'      },
  'medicine':        { category: 'salud',      parent: 'hogar'      },
  '🪑 furniture':    { category: 'hogar_misc', parent: 'hogar'      },
  'household':       { category: 'hogar_misc', parent: 'hogar'      },
  '🏛️ impuestos':    { category: 'impuestos',  parent: 'hogar'      },
  'trámites':        { category: 'impuestos',  parent: 'hogar'      },
  // Familia
  'familia':         { category: 'familia',    parent: 'familia'    },
  '🤗 invitar comida':{ category: 'familia',   parent: 'familia'    },
  'invitar comida':  { category: 'familia',    parent: 'familia'    },
  // Desarrollo personal
  '📙 education':    { category: 'educacion',  parent: 'desarrollo' },
  '📚 books':        { category: 'educacion',  parent: 'desarrollo' },
  'schooling':       { category: 'educacion',  parent: 'desarrollo' },
  'school supplies': { category: 'educacion',  parent: 'desarrollo' },
  'academy':         { category: 'educacion',  parent: 'desarrollo' },
  '🧥 apparel':      { category: 'ropa',       parent: 'desarrollo' },
  'clothing':        { category: 'ropa',       parent: 'desarrollo' },
  'shoes':           { category: 'ropa',       parent: 'desarrollo' },
  '🎸 gadgets':      { category: 'tecnologia', parent: 'desarrollo' },
  'electronics':     { category: 'tecnologia', parent: 'desarrollo' },
  '📱 apps':         { category: 'tecnologia', parent: 'desarrollo' },
  '🏐 sports':       { category: 'deporte',    parent: 'desarrollo' },
  'sports':          { category: 'deporte',    parent: 'desarrollo' },
  '🪅 events':       { category: 'eventos',    parent: 'desarrollo' },
  'decoration':      { category: 'hogar_misc', parent: 'hogar'      },
  // Fe
  '⛪️ diezmos cnn':  { category: 'diezmos',    parent: 'fe'         },
  '⛪ diezmos cnn':   { category: 'diezmos',    parent: 'fe'         },
  'diezmos cnn':     { category: 'diezmos',    parent: 'fe'         },
  '👐 offering':     { category: 'ofrenda',    parent: 'fe'         },
  'offering':        { category: 'ofrenda',    parent: 'fe'         },
  '⛪️ activities cnn':{ category: 'ofrenda',   parent: 'fe'         },
  '⛪ activities cnn': { category: 'ofrenda',   parent: 'fe'         },
  'activities cnn':  { category: 'ofrenda',    parent: 'fe'         },
  '🌏 ministerios':  { category: 'ministerios',parent: 'fe'         },
  'ministerios':     { category: 'ministerios',parent: 'fe'         },
  '🤓 formación':    { category: 'formacion',  parent: 'fe'         },
  'formación':       { category: 'formacion',  parent: 'fe'         },
  '🤗 ayuda a los necesitados': { category: 'ayuda', parent: 'fe'   },
  // Inversiones
  'sell':            { category: 'sell',        parent: 'inversiones'},
  'buy':             { category: 'buy',         parent: 'inversiones'},
  'materiales de construccion': { category: 'construccion', parent: 'inversiones'},
  'importación':     { category: 'construccion',parent: 'inversiones'},
  // Ingresos
  '💰 salary':       { category: 'salary',      parent: 'ingresos'  },
  '💵 ganancias':    { category: 'dividend',    parent: 'inversiones'},
  '🏅 bonus':        { category: 'bonus',       parent: 'ingresos'  },
  // Otros
  '🎁 gift':         { category: 'regalo',      parent: 'otros'     },
  '💸 préstamo':     { category: 'regalo',      parent: 'otros'     },
  'other':           { category: 'other',       parent: 'otros'     },
};

function mapCategory(rawCat, rawSub) {
  const key = (rawSub || rawCat || '').toLowerCase().trim();
  const cat = CATEGORY_MAP[key];
  if (cat) return cat;
  // intento con categoría padre
  const keyParent = (rawCat || '').toLowerCase().trim();
  return CATEGORY_MAP[keyParent] ?? { category: 'other', parent: 'otros' };
}

function mapType(incExp) {
  const v = (incExp || '').toLowerCase();
  if (v.includes('income')) return 'income';
  if (v.includes('exp'))    return 'expense';
  if (v.includes('transfer')) return 'transfer';
  return 'expense';
}

function parseDate(raw) {
  // "16/03/2026" → "2026-03-16"
  if (!raw) return null;
  const [d, m, y] = String(raw).split('/');
  if (!d || !m || !y) return String(raw);
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

// ── Leer XLSX ─────────────────────────────────────────────
const wb   = xlsxRead(readFileSync('2026-03-17.xlsx'));
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = xlsxUtils.sheet_to_json(ws, { defval: '' });

// Filtrar solo gastos/ingresos reales (no transfers entre cuentas propias)
const SKIP_TYPES = ['transfer-in', 'transfer-out', 'income balance'];
const filtered = rows.filter(r => {
  const t = (r['Income/Expense'] || '').toLowerCase();
  return !SKIP_TYPES.includes(t);
});

console.log(`Total filas: ${rows.length} | Filtrando transfers → ${filtered.length} transacciones`);

// ── Batch write Firestore (máx 500 por batch) ─────────────
let batch    = db.batch();
let count    = 0;
let batchNum = 0;

for (const row of filtered) {
  const { category, parent } = mapCategory(row['Category'], row['Subcategory']);
  const type    = mapType(row['Income/Expense']);
  const amount  = parseFloat(row['BOB'] || row['Amount'] || 0);
  const dateStr = parseDate(row['Period']);
  const concept = row['Note'] || row['Description'] || row['Subcategory'] || row['Category'] || '';
  const account = row['Accounts'] || '';

  const docRef = col.doc();
  batch.set(docRef, {
    title:     concept || category,
    concept:   concept,
    amount:    Math.abs(amount),
    currency:  row['Currency'] || 'BOB',
    type,
    category,
    parentCategory: parent,
    account,
    date:      dateStr,
    note:      row['Note'] || '',
    source:    'xlsx_import',
    createdAt: Timestamp.now(),
  });

  count++;
  if (count % 499 === 0) {
    await batch.commit();
    batchNum++;
    console.log(`Batch ${batchNum} commiteado (${count} docs)`);
    batch = db.batch();
  }
}

if (count % 499 !== 0) {
  await batch.commit();
  batchNum++;
  console.log(`Batch ${batchNum} commiteado (${count} docs total)`);
}

console.log(`\n✅ Migración completa: ${count} transacciones importadas.`);
