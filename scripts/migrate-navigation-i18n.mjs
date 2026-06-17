import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const applyChanges = process.argv.includes('--apply');
const files = [
  path.join(root, 'src', 'app', 'shared', 'osm_menu.ts'),
  path.join(root, 'src', 'app', 'shared', 'admin_menu.ts')
];
const localePaths = Object.fromEntries(
  ['en', 'fr', 'ar'].map(language => [
    language,
    path.join(root, 'src', 'assets', 'i18n', `${language}.json`)
  ])
);

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, fullKey, output);
    } else if (typeof child === 'string' && normalize(child) && !output.has(normalize(child))) {
      output.set(normalize(child), fullKey);
    }
  }
  return output;
}

function setNested(target, dottedKey, value) {
  const parts = dottedKey.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) {
    current[part] ??= {};
    current = current[part];
  }
  current[parts.at(-1)] = value;
}

function keyFor(value) {
  const slug = normalize(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 64);
  const hash = createHash('sha1').update(normalize(value)).digest('hex').slice(0, 8);
  return `AUTO.${slug || 'MENU'}_${hash}`;
}

const locales = {};
const reverseCatalog = new Map();
const catalogKeys = new Set();
function collectKeys(value, prefix = '') {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      collectKeys(child, fullKey);
    } else {
      catalogKeys.add(fullKey);
    }
  }
}
for (const [language, localePath] of Object.entries(localePaths)) {
  locales[language] = JSON.parse(await readFile(localePath, 'utf8'));
  collectKeys(locales[language]);
  for (const [value, key] of flatten(locales[language])) {
    if (!reverseCatalog.has(value)) {
      reverseCatalog.set(value, key);
    }
  }
}

const generated = new Map();
let replacementCount = 0;

for (const filePath of files) {
  const source = await readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const replacements = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const properties = new Map(node.properties
        .filter(ts.isPropertyAssignment)
        .filter(property => ts.isIdentifier(property.name))
        .map(property => [property.name.text, property]));
      const title = properties.get('title');
      if (properties.has('type')
          && title
          && (ts.isStringLiteral(title.initializer) || ts.isNoSubstitutionTemplateLiteral(title.initializer))
          && !/^[A-Z0-9_]+(?:\.[A-Z0-9_]+)+$/.test(title.initializer.text)
          && !catalogKeys.has(title.initializer.text)) {
        const normalized = normalize(title.initializer.text);
        const key = reverseCatalog.get(normalized) ?? keyFor(normalized);
        if (!reverseCatalog.has(normalized)) {
          generated.set(key, normalized);
        }
        replacements.push({
          start: title.initializer.getStart(sourceFile),
          end: title.initializer.getEnd(),
          value: `'${key}'`
        });
        replacementCount += 1;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  let updated = source;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    updated = updated.slice(0, replacement.start) + replacement.value + updated.slice(replacement.end);
  }
  if (applyChanges && replacements.length) {
    await writeFile(filePath, updated, 'utf8');
  }
}

if (applyChanges) {
  for (const [key, sourceText] of generated) {
    for (const locale of Object.values(locales)) {
      setNested(locale, key, sourceText);
    }
  }
  for (const [language, localePath] of Object.entries(localePaths)) {
    await writeFile(localePath, `${JSON.stringify(locales[language], null, 2)}\n`, 'utf8');
  }
}

console.log(JSON.stringify({
  mode: applyChanges ? 'apply' : 'dry-run',
  replacements: replacementCount,
  generatedKeys: generated.size
}, null, 2));
