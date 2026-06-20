import ts from 'typescript';
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

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

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
    .replace(/\{\{[^}]+}}/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 64);
  const hash = createHash('sha1').update(normalize(value)).digest('hex').slice(0, 8);
  return `AUTO.${slug || 'MESSAGE'}_${hash}`;
}

function quote(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

async function listTypeScriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(fullPath)));
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

for (const filePath of await listTypeScriptFiles(appRoot)) {
  const source = await readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const replacements = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ['success', 'error', 'warning', 'info'].includes(node.expression.name.text) &&
      ts.isPropertyAccessExpression(node.expression.expression) &&
      node.expression.expression.name.text === 'toast' &&
      node.arguments[0] &&
      ts.isTemplateExpression(node.arguments[0])
    ) {
      const template = node.arguments[0];
      let catalogValue = template.head.text;
      const params = [];
      template.templateSpans.forEach((span, index) => {
        const param = `value${index}`;
        catalogValue += `{{${param}}}${span.literal.text}`;
        params.push(`${param}: ${source.slice(span.expression.getStart(sourceFile), span.expression.getEnd())}`);
      });
      const key = resolveKey(catalogValue);
      replacements.push({
        start: template.getStart(sourceFile),
        end: template.getEnd(),
        value: `${quote(key)}, { ${params.join(', ')} }`
      });
      replacementCount += 1;
      return;
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
      generatedKeys: generated.size,
      files: changedFiles
    },
    null,
    2
  )
);
