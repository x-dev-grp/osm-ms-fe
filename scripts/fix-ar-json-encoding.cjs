const fs = require('fs');
const path = require('path');

const arJsonPath = path.join(__dirname, '..', 'src', 'assets', 'i18n', 'ar.json');

const CP1252_TO_BYTE = new Map([
  ['\u20AC', 0x80],
  ['\u201A', 0x82],
  ['\u0192', 0x83],
  ['\u201E', 0x84],
  ['\u2026', 0x85],
  ['\u2020', 0x86],
  ['\u2021', 0x87],
  ['\u02C6', 0x88],
  ['\u2030', 0x89],
  ['\u0160', 0x8a],
  ['\u2039', 0x8b],
  ['\u0152', 0x8c],
  ['\u017D', 0x8e],
  ['\u2018', 0x91],
  ['\u2019', 0x92],
  ['\u201C', 0x93],
  ['\u201D', 0x94],
  ['\u2022', 0x95],
  ['\u2013', 0x96],
  ['\u2014', 0x97],
  ['\u02DC', 0x98],
  ['\u2122', 0x99],
  ['\u0161', 0x9a],
  ['\u203A', 0x9b],
  ['\u0153', 0x9c],
  ['\u017E', 0x9e],
  ['\u0178', 0x9f]
]);

function looksMojibaked(str) {
  return /[ØÙÃÂØ§]|â€|[\u2013-\u201E\u2026\u2030]/.test(str) && !/[\u0600-\u06FF]/.test(str);
}

function fixMojibake(str) {
  if (!looksMojibaked(str)) {
    return str;
  }

  const bytes = [];
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }
    const mapped = CP1252_TO_BYTE.get(ch);
    if (mapped === undefined) {
      return str;
    }
    bytes.push(mapped);
  }

  try {
    return Buffer.from(bytes).toString('utf8');
  } catch {
    return str;
  }
}

function fixJsonStrings(content) {
  return content.replace(/"(?:\\.|[^"\\])*"/g, (match) => {
    const inner = match.slice(1, -1);
    const unescaped = inner
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    const fixed = fixMojibake(unescaped);
    if (fixed === unescaped) {
      return match;
    }
    const reescaped = fixed
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${reescaped}"`;
  });
}

const original = fs.readFileSync(arJsonPath, 'utf8');
const fixed = fixJsonStrings(original);
JSON.parse(fixed);
fs.writeFileSync(arJsonPath, fixed, 'utf8');

const parsed = JSON.parse(fixed);
let remaining = 0;
const walk = (obj) => {
  if (typeof obj === 'string') {
    if (/[ØÙÃ]|â€/.test(obj) && !/[\u0600-\u06FF]/.test(obj)) {
      remaining += 1;
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach(walk);
    return;
  }
  if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(walk);
  }
};
walk(parsed);

console.log('Fixed ar.json successfully');
console.log('Remaining suspicious strings:', remaining);
console.log('GO_HOME:', parsed.ACCESS_DENIED.GO_HOME);
console.log('MIXED:', parsed.FINANCE?.TRANSACTIONS?.PAYMENT_METHODS?.MIXED);
console.log('DESCRIPTION:', parsed.FINANCE?.TRANSACTIONS?.PLACEHOLDERS?.DESCRIPTION);
console.log('HR ARIA:', parsed.HR?.QUICK_NAV?.ARIA);
