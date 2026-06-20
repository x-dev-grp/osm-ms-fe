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
const stateNames = new Set(['dialogTitle', 'errorMessage', 'pageTitle', 'placeholder', 'successMessage', 'warningMessage']);

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
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 64);
  const hash = createHash('sha1').update(normalize(value)).digest('hex').slice(0, 8);
  return `AUTO.${slug || 'MESSAGE'}_${hash}`;
}

function isTranslationKey(value) {
  return /^[A-Z0-9_]+(?:\.[A-Z0-9_]+)+$/.test(value);
}

function quote(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function propertyName(node) {
  if (!node) {
    return undefined;
  }
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text;
  }
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text;
  }
  return undefined;
}

function enclosingClass(node) {
  let current = node.parent;
  while (current && !ts.isClassDeclaration(current)) {
    current = current.parent;
  }
  return current;
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
const changedFiles = [];
let replacementCount = 0;
let injectedClasses = 0;

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

for (const filePath of await listTypeScriptFiles(appRoot)) {
  const source = await readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const replacements = [];
  const classIdentifiers = new Map();
  const classesNeedingInjection = new Set();

  function existingTranslateIdentifier(classNode) {
    for (const member of classNode.members) {
      if (
        ts.isPropertyDeclaration(member) &&
        member.initializer &&
        ts.isCallExpression(member.initializer) &&
        ts.isIdentifier(member.initializer.expression) &&
        member.initializer.expression.text === 'inject' &&
        member.initializer.arguments.some((argument) => ts.isIdentifier(argument) && argument.text === 'TranslateService')
      ) {
        return propertyName(member.name);
      }
      if (ts.isConstructorDeclaration(member)) {
        for (const parameter of member.parameters) {
          if (
            parameter.type &&
            ts.isTypeReferenceNode(parameter.type) &&
            ts.isIdentifier(parameter.type.typeName) &&
            parameter.type.typeName.text === 'TranslateService'
          ) {
            return propertyName(parameter.name);
          }
        }
      }
    }
    return undefined;
  }

  function translateIdentifier(classNode) {
    if (classIdentifiers.has(classNode)) {
      return classIdentifiers.get(classNode);
    }
    const existing = existingTranslateIdentifier(classNode);
    if (existing) {
      classIdentifiers.set(classNode, existing);
      return existing;
    }
    let candidate = 'i18n';
    const memberNames = new Set(classNode.members.map((member) => propertyName(member.name)).filter(Boolean));
    while (memberNames.has(candidate)) {
      candidate = `_${candidate}`;
    }
    classIdentifiers.set(classNode, candidate);
    classesNeedingInjection.add(classNode);
    return candidate;
  }

  function replaceLiteral(node) {
    if (!(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
      return;
    }
    if (!normalize(node.text) || isTranslationKey(node.text)) {
      return;
    }
    const classNode = enclosingClass(node);
    if (!classNode) {
      return;
    }
    const identifier = translateIdentifier(classNode);
    const key = resolveKey(node.text);
    replacements.push({
      start: node.getStart(sourceFile),
      end: node.getEnd(),
      value: `this.${identifier}.instant(${quote(key)})`
    });
    replacementCount += 1;
  }

  function collectExpressionLiterals(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'instant') {
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      replaceLiteral(node);
      return;
    }
    ts.forEachChild(node, collectExpressionLiterals);
  }

  function visit(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && stateNames.has(propertyName(node.left))) {
      collectExpressionLiterals(node.right);
      return;
    }
    if ((ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) && stateNames.has(propertyName(node.name)) && node.initializer) {
      collectExpressionLiterals(node.initializer);
      return;
    }
    if (ts.isCallExpression(node)) {
      const calledName = propertyName(node.expression);
      if (['alert', 'confirm', 'prompt', 'setTitle'].includes(calledName) && node.arguments[0]) {
        collectExpressionLiterals(node.arguments[0]);
        return;
      }
      if (calledName === 'resolveErrorMessage') {
        for (const argument of node.arguments.slice(1)) {
          collectExpressionLiterals(argument);
        }
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!replacements.length) {
    continue;
  }

  for (const classNode of classesNeedingInjection) {
    replacements.push({
      start: classNode.members.pos,
      end: classNode.members.pos,
      value: `\n  private readonly ${classIdentifiers.get(classNode)} = inject(TranslateService);`
    });
    injectedClasses += 1;
  }

  const needsInjectImport =
    classesNeedingInjection.size > 0 && !/\bimport\s*{[^}]*\binject\b[^}]*}\s*from\s*['"]@angular\/core['"]/.test(source);
  const needsTranslateImport =
    classesNeedingInjection.size > 0 && !/\bimport\s*{[^}]*\bTranslateService\b[^}]*}\s*from\s*['"]@ngx-translate\/core['"]/.test(source);
  let imports = '';
  if (needsInjectImport) {
    imports += `import { inject } from '@angular/core';\n`;
  }
  if (needsTranslateImport) {
    imports += `import { TranslateService } from '@ngx-translate/core';\n`;
  }
  if (imports) {
    replacements.push({ start: 0, end: 0, value: imports });
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
      injectedClasses,
      generatedKeys: generated.size,
      files: changedFiles
    },
    null,
    2
  )
);
