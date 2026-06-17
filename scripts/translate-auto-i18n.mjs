import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const localePaths = {
  en: path.join(root, 'src', 'assets', 'i18n', 'en.json'),
  fr: path.join(root, 'src', 'assets', 'i18n', 'fr.json'),
  ar: path.join(root, 'src', 'assets', 'i18n', 'ar.json')
};
const concurrency = 8;

const locales = {};
for (const [language, localePath] of Object.entries(localePaths)) {
  locales[language] = JSON.parse(await readFile(localePath, 'utf8'));
}

const sourceEntries = Object.entries(locales.en.AUTO ?? {});
const jobs = [];
for (const [key, source] of sourceEntries) {
  for (const language of Object.keys(localePaths)) {
    jobs.push({ key, source, language });
  }
}

async function translate(source, target, attempt = 1) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', target);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', source);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    const translated = payload[0]
      .map((segment) => segment[0])
      .join('')
      .trim();
    return translated || source;
  } catch (error) {
    if (attempt >= 4) {
      console.warn(`Translation failed for ${target}: ${source}`);
      return source;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    return translate(source, target, attempt + 1);
  }
}

let cursor = 0;
let completed = 0;
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    locales[job.language].AUTO[job.key] =
      await translate(job.source, job.language);
    completed += 1;
    if (completed % 100 === 0) {
      console.log(`Translated ${completed}/${jobs.length}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

for (const [language, localePath] of Object.entries(localePaths)) {
  await writeFile(localePath, `${JSON.stringify(locales[language], null, 2)}\n`, 'utf8');
}

console.log(`Translated ${sourceEntries.length} generated keys into en, fr, and ar.`);
