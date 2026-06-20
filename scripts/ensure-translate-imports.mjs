import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const appRoot = path.join(root, 'src', 'app');

async function listFiles(directory, suffix) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, suffix)));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      files.push(fullPath);
    }
  }
  return files;
}

let updatedCount = 0;
for (const htmlPath of await listFiles(appRoot, '.html')) {
  const html = await readFile(htmlPath, 'utf8');
  if (!html.includes('| translate')) {
    continue;
  }

  const tsPath = htmlPath.replace(/\.html$/, '.ts');
  let source;
  try {
    source = await readFile(tsPath, 'utf8');
  } catch {
    continue;
  }

  const explicitlyStandalone = /standalone\s*:\s*true/.test(source);
  const implicitlyStandalone = /@Component\s*\(\s*\{[\s\S]*?\bimports\s*:\s*\[/.test(source);
  if ((!explicitlyStandalone && !implicitlyStandalone) || /\bTranslateModule\b/.test(source)) {
    continue;
  }

  const ngxImport = /import\s*\{([^}]+)\}\s*from\s*['"]@ngx-translate\/core['"];/;
  if (ngxImport.test(source)) {
    source = source.replace(ngxImport, (full, imports) => {
      const names = imports
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      names.push('TranslateModule');
      return `import { ${[...new Set(names)].join(', ')} } from '@ngx-translate/core';`;
    });
  } else {
    const lastImportEnd = [...source.matchAll(/^import .*;$/gm)].at(-1);
    if (!lastImportEnd) {
      throw new Error(`No import insertion point in ${tsPath}`);
    }
    const index = lastImportEnd.index + lastImportEnd[0].length;
    source = source.slice(0, index) + "\nimport { TranslateModule } from '@ngx-translate/core';" + source.slice(index);
  }

  if (/imports\s*:\s*\[/.test(source)) {
    source = source.replace(/imports\s*:\s*\[/, 'imports: [TranslateModule, ');
  } else if (explicitlyStandalone) {
    source = source.replace(/(standalone\s*:\s*true\s*,?)/, '$1\n  imports: [TranslateModule],');
  } else {
    throw new Error(`Implicit standalone component has no imports array: ${tsPath}`);
  }

  await writeFile(tsPath, source, 'utf8');
  updatedCount += 1;
}

console.log(`Updated ${updatedCount} standalone components with TranslateModule.`);
