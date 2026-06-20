import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const applyChanges = process.argv.includes('--apply');
const appRoot = path.join(root, 'src', 'app');
const localePaths = Object.fromEntries(
  ['en', 'fr', 'ar'].map((language) => [language, path.join(root, 'src', 'assets', 'i18n', `${language}.json`)])
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
  return `AUTO.${slug || 'LABEL'}_${hash}`;
}

async function listConfigFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listConfigFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const locales = {};
const reverseCatalog = new Map();
for (const [language, localePath] of Object.entries(localePaths)) {
  locales[language] = JSON.parse(await readFile(localePath, 'utf8'));
  for (const [value, key] of flatten(locales[language])) {
    if (!reverseCatalog.has(value)) {
      reverseCatalog.set(value, key);
    }
  }
}

const generated = new Map();
let replacementCount = 0;
const changedFiles = [];

function resolveKey(value) {
  const existing = reverseCatalog.get(normalize(value));
  if (existing) {
    return existing;
  }
  const key = keyFor(value);
  generated.set(key, normalize(value));
  return key;
}

for (const filePath of await listConfigFiles(appRoot)) {
  const source = await readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const replacements = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const names = new Set(
        node.properties.filter(ts.isPropertyAssignment).map((property) => (ts.isIdentifier(property.name) ? property.name.text : undefined))
      );
      const isDashboard = names.has('fields') && (names.has('baseURL') || names.has('searchEndpoint'));
      const isDashboardField = names.has('name') && (names.has('attributeType') || names.has('fieldType'));
      const isDashboardOption =
        ts.isArrayLiteralExpression(node.parent) &&
        ts.isPropertyAssignment(node.parent.parent) &&
        ts.isIdentifier(node.parent.parent.name) &&
        node.parent.parent.name.text === 'options';
      for (const property of node.properties) {
        if (
          !ts.isPropertyAssignment(property) ||
          !ts.isIdentifier(property.name) ||
          !['title', 'label'].includes(property.name.text) ||
          !(ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer))
        ) {
          continue;
        }
        if (
          (property.name.text === 'title' && !isDashboard) ||
          (property.name.text === 'label' && !isDashboardField && !isDashboardOption)
        ) {
          continue;
        }
        const pathName = `${property.name.text}TranslatePath`;
        if (names.has(pathName) || !normalize(property.initializer.text)) {
          continue;
        }
        const key = resolveKey(property.initializer.text);
        replacements.push({
          start: property.end,
          end: property.end,
          value: `,\n${' '.repeat(sourceFile.getLineAndCharacterOfPosition(property.getStart(sourceFile)).character)}${pathName}: '${key}'`
        });
        replacementCount += 1;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!replacements.length) {
    continue;
  }
  let updated = source;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    updated = updated.slice(0, replacement.start) + replacement.value + updated.slice(replacement.end);
  }
  changedFiles.push(path.relative(root, filePath));
  if (applyChanges) {
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

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      changedFiles: changedFiles.length,
      replacements: replacementCount,
      generatedKeys: generated.size
    },
    null,
    2
  )
);
