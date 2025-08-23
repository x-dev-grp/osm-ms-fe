import fs from 'fs';

// Read the JSON files
const en = JSON.parse(fs.readFileSync('src/assets/i18n/en.json', 'utf8'));
const fr = JSON.parse(fs.readFileSync('src/assets/i18n/fr.json', 'utf8'));

function getKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(getKeys(en));
const frKeys = new Set(getKeys(fr));

const missingInFr = [...enKeys].filter(key => !frKeys.has(key));
const missingInEn = [...frKeys].filter(key => !enKeys.has(key));

console.log('=== KEYS MISSING IN FRENCH ===');
missingInFr.forEach(key => console.log(key));

console.log('\n=== KEYS MISSING IN ENGLISH ===');
missingInEn.forEach(key => console.log(key));

console.log('\n=== SUMMARY ===');
console.log('English keys:', enKeys.size);
console.log('French keys:', frKeys.size);
console.log('Missing in French:', missingInFr.length);
console.log('Missing in English:', missingInEn.length); 