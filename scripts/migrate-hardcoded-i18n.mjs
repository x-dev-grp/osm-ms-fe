import { parseTemplate } from '@angular/compiler';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const applyChanges = process.argv.includes('--apply');
const appRoot = path.join(root, 'src', 'app');
const localePaths = {
  en: path.join(root, 'src', 'assets', 'i18n', 'en.json'),
  fr: path.join(root, 'src', 'assets', 'i18n', 'fr.json'),
  ar: path.join(root, 'src', 'assets', 'i18n', 'ar.json')
};
const translatableAttributes = new Set(['aria-label', 'matTooltip', 'placeholder', 'title']);
const skippedElements = new Set(['code', 'mat-icon', 'script', 'style']);

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, fullKey, output);
    } else if (typeof child === 'string') {
      const normalized = normalize(child);
      if (normalized && !output.has(normalized)) {
        output.set(normalized, fullKey);
      }
    }
  }
  return output;
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isVisibleText(value) {
  const normalized = normalize(value);
  return normalized.length > 1 && /[\p{L}]/u.test(normalized) && !normalized.includes('{{') && !normalized.includes('}}');
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
  return `AUTO.${slug || 'TEXT'}_${hash}`;
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

async function listHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listHtmlFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
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
const changedFiles = [];
let replacementCount = 0;
let attributeCount = 0;

function resolveKey(value) {
  const normalized = normalize(value);
  const existing = reverseCatalog.get(normalized);
  if (existing) {
    return existing;
  }
  const key = keyFor(normalized);
  generated.set(key, normalized);
  return key;
}

for (const filePath of await listHtmlFiles(appRoot)) {
  const source = await readFile(filePath, 'utf8');
  const parsed = parseTemplate(source, filePath, { preserveWhitespaces: true });
  if (parsed.errors?.length) {
    console.warn(`SKIP parse errors: ${path.relative(root, filePath)}`);
    continue;
  }

  const replacements = [];

  function visit(node, parentName = '') {
    const nodeName = node.name ?? parentName;
    if (node.constructor.name.startsWith('Text') && !skippedElements.has(parentName) && isVisibleText(node.value)) {
      const leading = node.value.match(/^\s*/)?.[0] ?? '';
      const trailing = node.value.match(/\s*$/)?.[0] ?? '';
      const key = resolveKey(node.value);
      replacements.push({
        start: node.sourceSpan.start.offset,
        end: node.sourceSpan.end.offset,
        value: `${leading}{{ '${key}' | translate }}${trailing}`
      });
      replacementCount += 1;
    }

    if (!skippedElements.has(nodeName)) {
      for (const attribute of node.attributes ?? []) {
        if (!translatableAttributes.has(attribute.name) || !isVisibleText(attribute.value)) {
          continue;
        }
        const key = resolveKey(attribute.value);
        const bindingName = attribute.name === 'aria-label' ? 'attr.aria-label' : attribute.name;
        replacements.push({
          start: attribute.sourceSpan.start.offset,
          end: attribute.sourceSpan.end.offset,
          value: `[${bindingName}]="'${key}' | translate"`
        });
        attributeCount += 1;
      }
    }

    for (const collection of [
      node.children,
      node.branches,
      node.cases,
      node.placeholder?.children,
      node.loading?.children,
      node.error?.children,
      node.empty?.children
    ]) {
      for (const child of collection ?? []) {
        visit(child, nodeName);
      }
    }
  }

  for (const node of parsed.nodes) {
    visit(node);
  }

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
      textReplacements: replacementCount,
      attributeReplacements: attributeCount,
      generatedKeys: generated.size,
      files: changedFiles
    },
    null,
    2
  )
);
