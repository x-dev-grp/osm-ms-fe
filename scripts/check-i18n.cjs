/**
 * Complete translation audit for the frontend.
 *
 * Checks:
 * - key parity and empty values across en/fr/ar;
 * - literal translation keys referenced by templates and TypeScript;
 * - runtime keys assembled from enums and dashboard actions.
 *
 * Reports are written to i18n-audit/. The command fails when an issue exists,
 * unless --report-only is supplied.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const reportDir = path.join(root, 'i18n-audit');
const reportOnly = process.argv.includes('--report-only');

function run(script) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`Translation audit failed to execute: ${script}`);
    process.exit(2);
  }
}

run('i18n-audit.cjs');
run('i18n-dynamic-audit.cjs');

const staticSummary = JSON.parse(fs.readFileSync(path.join(reportDir, 'summary.json'), 'utf8'));
const dynamicSummary = JSON.parse(fs.readFileSync(path.join(reportDir, 'dynamic-summary.json'), 'utf8'));
const categories = {
  dictionaryKeysMissing: Object.values(staticSummary.missingAcrossLangs).reduce((sum, value) => sum + value, 0),
  emptyTranslations: Object.values(staticSummary.emptyValues).reduce((sum, value) => sum + value, 0),
  referencedKeysMissing:
    staticSummary.usedButMissingEn + staticSummary.usedButMissingFr + staticSummary.usedButMissingAr,
  dynamicEntriesMissing: dynamicSummary.totalMissingEntries
};
const issueCount = Object.values(categories).reduce((sum, value) => sum + value, 0);
const combined = {
  passed: issueCount === 0,
  issueCount,
  categories,
  keyCounts: staticSummary.keyCounts,
  reports: [
    'missing-in-en.txt', 'missing-in-fr.txt', 'missing-in-ar.txt',
    'used-keys-missing-in-en.txt', 'used-keys-missing-in-fr.txt', 'used-keys-missing-in-ar.txt',
    'missing-dynamic-enum-keys.txt'
  ]
};

fs.writeFileSync(path.join(reportDir, 'check-summary.json'), `${JSON.stringify(combined, null, 2)}\n`, 'utf8');
console.log('\nComplete i18n check:');
console.log(JSON.stringify(combined, null, 2));

if (issueCount && !reportOnly) process.exit(1);
