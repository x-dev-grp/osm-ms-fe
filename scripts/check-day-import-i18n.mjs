import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const page = join(process.cwd(), 'src/app/reception/import');
const source = readdirSync(page)
  .filter((name) => /\.(html|ts)$/.test(name))
  .map((name) => readFileSync(join(page, name), 'utf8'))
  .join('\n');
const keys = new Set([...source.matchAll(/ABIOOC\.DAY_IMPORT\.[A-Z_]+(?:\.[A-Z_]+)?/g)].map((match) => match[0]));
keys.delete('ABIOOC.DAY_IMPORT.STATUS');
keys.delete('ABIOOC.DAY_IMPORT.DRIVE_RESULTS');
for (const status of ['CREATE', 'LINK_EXISTING', 'SKIP_DUPLICATE', 'ERROR', 'WARNING']) keys.add(`ABIOOC.DAY_IMPORT.STATUS.${status}`);
for (const result of [
  'NEVER',
  'OK',
  'RUNNING',
  'ERROR',
  'DISCONNECTED',
  'SKIPPED_NOT_CONFIGURED',
  'SKIPPED_OAUTH_NOT_CONFIGURED',
  'SKIPPED_NOT_CONNECTED',
  'SKIPPED_DISABLED',
  'SKIPPED_NO_FOLDER',
  'COMPLETED_WITH_ERRORS',
  'COMMITTED_ROUTING_PENDING'
])
  keys.add(`ABIOOC.DAY_IMPORT.DRIVE_RESULTS.${result}`);
const resolve = (dictionary, key) => key.split('.').reduce((value, part) => value?.[part], dictionary);
const dictionaries = Object.fromEntries(
  ['en', 'fr', 'ar'].map((lang) => [lang, JSON.parse(readFileSync(`src/assets/i18n/${lang}.json`, 'utf8'))])
);
for (const [lang, dictionary] of Object.entries(dictionaries)) {
  for (const key of keys) {
    const value = resolve(dictionary, key);
    assert.ok(typeof value === 'string' && value.trim() && value !== key, `${lang}: missing ${key}`);
    const placeholders = (text) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort();
    assert.deepEqual(placeholders(value), placeholders(resolve(dictionaries.en, key)), `${lang}: interpolation mismatch in ${key}`);
  }
  console.log(`${lang}: ${keys.size} import translation keys verified`);
}
