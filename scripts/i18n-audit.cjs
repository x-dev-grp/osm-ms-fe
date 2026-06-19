const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, '../src/assets/i18n');
const srcRoot = path.join(__dirname, '../src');
const reportDir = path.join(__dirname, '../i18n-audit');
const langs = ['en', 'fr', 'ar'];

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

function extractKeys(content) {
  const keys = new Set();
  const patterns = [
    /\{\{\s*['"]([A-Z][A-Z0-9_.]*)['"]\s*\|\s*translate/g,
    /translate\s*:\s*['"]([A-Z][A-Z0-9_.]*)['"]/g,
    /(?:i18n|translateService|this\.i18n)\.instant\(\s*['"]([A-Z][A-Z0-9_.]*)['"]/gi,
    /toastService\.(?:error|success|info|warning)\(\s*['"]([A-Z][A-Z0-9_.]*)['"]/g,
    /titleTranslatePath:\s*['"]([A-Z][A-Z0-9_.]*)['"]/g,
    /labelTranslatePath:\s*['"]([A-Z][A-Z0-9_.]*)['"]/g,
    /\[matTooltip\]="['"]([A-Z][A-Z0-9_.]*)['"]\s*\|\s*translate/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) {
      keys.add(match[1]);
    }
  }
  return keys;
}

const flat = {};
for (const lang of langs) {
  flat[lang] = flatten(JSON.parse(fs.readFileSync(path.join(i18nDir, `${lang}.json`), 'utf8')));
}

const allKeys = new Set(langs.flatMap((lang) => Object.keys(flat[lang])));
const missing = Object.fromEntries(langs.map((lang) => [lang, []]));
const empty = Object.fromEntries(langs.map((lang) => [lang, []]));
const untranslatedCopy = Object.fromEntries(langs.map((lang) => [lang, []]));

for (const key of allKeys) {
  for (const lang of langs) {
    if (!(key in flat[lang])) {
      missing[lang].push(key);
      continue;
    }
    const value = flat[lang][key];
    if (value === '' || value === null || value === undefined) {
      empty[lang].push(key);
    } else if (typeof value === 'string') {
      if (value === key || /^[A-Z][A-Z0-9_.]+$/.test(value) && value.includes('.') && !(key.includes('.'))) {
        // noop
      }
      if (/^(AUTO\.|MENU\.|PDF\.)/.test(value) && value === key.split('.').slice(-1).join('.')) {
        // possible placeholder
      }
      if (value.startsWith('AUTO.') || value.startsWith('MENU.') || value.startsWith('PDF.')) {
        if (!(value in flat[lang]) && value.includes('.')) {
          untranslatedCopy[lang].push({ key, value });
        }
      }
      if (/^[A-Z][A-Z0-9_.]*$/.test(value) && value.includes('.') && !(value in flat[lang])) {
        untranslatedCopy[lang].push({ key, value });
      }
    }
  }
}

for (const lang of langs) {
  missing[lang].sort();
  empty[lang].sort();
}

const usedKeys = new Set();
const keyLocations = {};
for (const file of walk(srcRoot)) {
  const rel = path.relative(srcRoot, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  for (const key of extractKeys(content)) {
    usedKeys.add(key);
    if (!keyLocations[key]) keyLocations[key] = [];
    if (keyLocations[key].length < 3) keyLocations[key].push(rel);
  }
}

const missingInEn = [...usedKeys].filter((k) => !(k in flat.en)).sort();
const missingInFr = [...usedKeys].filter((k) => !(k in flat.fr)).sort();
const missingInAr = [...usedKeys].filter((k) => !(k in flat.ar)).sort();
const wrongCase = [...usedKeys].filter((k) => /^[a-z]/.test(k) || k.startsWith('supplier.') || k.startsWith('fournisseur.')).sort();

const prefixCount = (keys) => {
  const counts = {};
  for (const key of keys) {
    const prefix = key.split('.')[0];
    counts[prefix] = (counts[prefix] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
};

const orphanEn = Object.keys(flat.en).filter((k) => !usedKeys.has(k));

fs.mkdirSync(reportDir, { recursive: true });
const write = (name, content) => fs.writeFileSync(path.join(reportDir, name), content);

write('summary.json', JSON.stringify({
  keyCounts: Object.fromEntries(langs.map((l) => [l, Object.keys(flat[l]).length])),
  missingAcrossLangs: Object.fromEntries(langs.map((l) => [l, missing[l].length])),
  emptyValues: Object.fromEntries(langs.map((l) => [l, empty[l].length])),
  usedKeysInCode: usedKeys.size,
  usedButMissingEn: missingInEn.length,
  usedButMissingFr: missingInFr.length,
  usedButMissingAr: missingInAr.length,
  wrongCaseKeysUsed: wrongCase.length,
  orphanKeysInEn: orphanEn.length,
}, null, 2));

write('missing-in-fr.txt', missing.fr.join('\n'));
write('missing-in-en.txt', missing.en.join('\n'));
write('missing-in-ar.txt', missing.ar.join('\n'));
write('empty-ar.txt', empty.ar.join('\n'));
write('empty-fr.txt', empty.fr.join('\n'));
write('empty-en.txt', empty.en.join('\n'));
write('used-keys-missing-in-en.txt', missingInEn.join('\n'));
write('used-keys-missing-in-fr.txt', missingInFr.join('\n'));
write('used-keys-missing-in-ar.txt', missingInAr.join('\n'));
write('wrong-case-keys-used.txt', wrongCase.join('\n'));
write('used-missing-en-with-locations.txt', missingInEn.map((k) => `${k} -> ${(keyLocations[k] || []).join(', ')}`).join('\n'));

write('missing-en-prefixes.txt', prefixCount(missingInEn).map(([p, c]) => `${p}: ${c}`).join('\n'));
write('in-en-not-in-fr.txt', Object.keys(flat.en).filter((k) => !(k in flat.fr)).sort().join('\n'));
write('in-en-not-in-ar.txt', Object.keys(flat.en).filter((k) => !(k in flat.ar)).sort().join('\n'));
write('in-fr-not-in-en.txt', Object.keys(flat.fr).filter((k) => !(k in flat.en)).sort().join('\n'));
write('in-ar-not-in-en.txt', Object.keys(flat.ar).filter((k) => !(k in flat.en)).sort().join('\n'));

// Values that look like untranslated key references
const badValues = [];
for (const lang of langs) {
  for (const [key, value] of Object.entries(flat[lang])) {
    if (typeof value === 'string' && /^[A-Z][A-Z0-9_.]+$/.test(value) && value.includes('.') && !(value in flat[lang])) {
      badValues.push(`${lang}\t${key}\t${value}`);
    }
    if (typeof value === 'string' && (value.startsWith('PDF.') || value.startsWith('AUTO.')) && value === flat.en[key] && lang !== 'en') {
      // French text in wrong lang file detection skipped
    }
  }
}
write('values-looking-like-keys.txt', badValues.join('\n'));

console.log(JSON.parse(fs.readFileSync(path.join(reportDir, 'summary.json'), 'utf8')));
