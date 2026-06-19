/**
 * Find i18n keys that can appear untranslated at runtime (dynamic prefixes + enum values).
 * Run: node scripts/i18n-dynamic-audit.cjs
 */
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '../src/assets/i18n');
const SRC_ROOT = path.join(__dirname, '../src');
const REPORT_DIR = path.join(__dirname, '../i18n-audit');
const LANGS = ['en', 'fr', 'ar'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.angular'].includes(entry.name)) {
        walk(full, files);
      }
    } else if (/\.(html|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function parseTsEnumValues(filePath, enumName) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`enum ${enumName}\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) {
    return [];
  }
  const values = new Set();
  for (const m of match[1].matchAll(/\b([A-Z][A-Z0-9_]*)\s*=\s*['"]([^'"]+)['"]/g)) {
    values.add(m[2]);
  }
  for (const m of match[1].matchAll(/\b([A-Z][A-Z0-9_]*)\s*,/g)) {
    values.add(m[1]);
  }
  return [...values];
}

function parseJavaEnumValues(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/enum OperationType\s*\{([^}]+)\}/);
  if (!match) {
    return [];
  }
  return match[1]
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function scanDashboardActions() {
  const actions = new Set();
  for (const file of walk(SRC_ROOT)) {
    if (!file.endsWith('.ts')) {
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(/action:\s*'([A-Z][A-Z0-9_]*)'/g)) {
      actions.add(m[1]);
    }
  }
  for (const m of fs.readFileSync(path.join(SRC_ROOT, 'app/shared/modules/osm-dashboard/models/actions.ts'), 'utf8').matchAll(/\['([A-Z][A-Z0-9_]*)'/g)) {
    actions.add(m[1]);
  }
  return [...actions];
}

function missingForPrefix(flat, prefix, values) {
  const missing = [];
  for (const value of values) {
    const key = `${prefix}.${value}`;
    for (const lang of LANGS) {
      if (!(key in flat[lang]) || flat[lang][key] === '') {
        missing.push({ lang, key, value, prefix });
      }
    }
  }
  return missing;
}

const flat = {};
for (const lang of LANGS) {
  flat[lang] = flatten(JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${lang}.json`), 'utf8')));
}

const enumBacked = {
  'TRANSACTIONS.TYPES': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/financial-transaction.model.ts'), 'TransactionType'),
  'TRANSACTIONS.DIRECTIONS': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/financial-transaction.model.ts'), 'TransactionDirection'),
  'TRANSACTIONS.CURRENCIES': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/financial-transaction.model.ts'), 'Currency'),
  'TRANSACTIONS.PAYMENT_METHODS': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/financial-transaction.model.ts'), 'PaymentMethod'),
  'DELIVERIES.OPERATION_TYPE': parseJavaEnumValues(path.join(__dirname, '../../oosm/modules/shared-kernel/src/main/java/com/xdev/ooms/sharedkernel/Enum/OperationType.java')),
  OPERATION_TYPE: parseTsEnumValues(path.join(SRC_ROOT, 'app/shared/models/operation-type.enum.ts'), 'OperationType'),
  'OIL_TRANSACTIONS.QUALITY_GRADES': parseTsEnumValues(path.join(SRC_ROOT, 'app/shared/models/quality-grades.enum.ts'), 'QualityGrades'),
  'OIL_SALES.STATUS': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/oil-sale.model.ts'), 'OilSaleStatus'),
  'OIL_SALES.PAYMENT_METHODS': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/financial-transaction.model.ts'), 'PaymentMethod'),
  'EXPENSE.CATEGORY': parseTsEnumValues(path.join(SRC_ROOT, 'app/finance/models/expense.model.ts'), 'ExpenseCategory'),
  'OSM_DASHBOARD.ACTIONS': scanDashboardActions(),
  'STORAGE.VIEW.STATUS': [
    'AVAILABLE', 'FULL', 'FILLING', 'MAINTENANCE', 'IN_USE', 'CLEANING', 'RESERVED', 'OUT_OF_SERVICE'
  ],
};

const allMissing = [];
for (const [prefix, values] of Object.entries(enumBacked)) {
  allMissing.push(...missingForPrefix(flat, prefix, values));
}

const uniqueMissingKeys = [...new Set(allMissing.map((r) => r.key))].sort();

fs.mkdirSync(REPORT_DIR, { recursive: true });
const write = (name, lines) => fs.writeFileSync(path.join(REPORT_DIR, name), `${lines.join('\n')}\n`, 'utf8');

write('missing-dynamic-enum-keys.txt', allMissing.map((r) => `${r.lang}\t${r.key}`).sort());
write('missing-dynamic-enum-keys-unique.txt', uniqueMissingKeys);

const byPrefix = {};
for (const [prefix, values] of Object.entries(enumBacked)) {
  const missingValues = [...new Set(allMissing.filter((r) => r.prefix === prefix).map((r) => r.value))];
  byPrefix[prefix] = { total: values.length, missing: missingValues.length, missingValues };
}

const summary = {
  uniqueMissingDynamicKeys: uniqueMissingKeys.length,
  totalMissingEntries: allMissing.length,
  byPrefix,
  uniqueMissingKeys,
};

fs.writeFileSync(path.join(REPORT_DIR, 'dynamic-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
