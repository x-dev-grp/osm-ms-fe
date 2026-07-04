#!/usr/bin/env node
/**
 * Bump frontend semver from VERSION file and sync package.json.
 *
 * Usage:
 *   node scripts/version/bump-version.cjs patch|minor|major|set 1.2.3
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../..');
const versionFile = path.join(repoRoot, 'VERSION');
const packageFile = path.join(repoRoot, 'package.json');
const changelogFile = path.join(repoRoot, 'CHANGELOG.md');

function readVersion() {
  const raw = fs.readFileSync(versionFile, 'utf8').trim();
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?$/);
  if (!match) {
    throw new Error(`Invalid VERSION file content: "${raw}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null
  };
}

function formatVersion(v) {
  return v.prerelease ? `${v.major}.${v.minor}.${v.patch}-${v.prerelease}` : `${v.major}.${v.minor}.${v.patch}`;
}

function bump(kind) {
  const v = readVersion();
  if (kind === 'major') {
    v.major += 1;
    v.minor = 0;
    v.patch = 0;
  } else if (kind === 'minor') {
    v.minor += 1;
    v.patch = 0;
  } else if (kind === 'patch') {
    v.patch += 1;
  } else {
    throw new Error(`Unknown bump kind: ${kind}`);
  }
  v.prerelease = null;
  return formatVersion(v);
}

function setVersion(explicit) {
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(explicit)) {
    throw new Error(`Invalid semver: ${explicit}`);
  }
  return explicit;
}

function syncPackageJson(version) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function gitCommitSubjects() {
  let fromRef = '';
  try {
    fromRef = execSync('git describe --tags --abbrev=0', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    fromRef = '';
  }
  const range = fromRef ? `${fromRef}..HEAD` : 'HEAD';
  try {
    return execSync(`git log ${range} --pretty=format:%s`, { cwd: repoRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return ['Release'];
  }
}

function appendChangelog(version) {
  if (!fs.existsSync(changelogFile)) {
    fs.writeFileSync(changelogFile, '# Changelog\n\n', 'utf8');
  }
  let section = `## [${version}] - ${new Date().toISOString().slice(0, 10)}\n\n`;
  for (const line of gitCommitSubjects()) {
    section += `- ${line}\n`;
  }
  section += '\n';
  const existing = fs.readFileSync(changelogFile, 'utf8');
  const header = '# Changelog\n\n';
  const body = existing.startsWith(header) ? existing.slice(header.length) : existing;
  fs.writeFileSync(changelogFile, header + section + body, 'utf8');
}

const args = process.argv.slice(2);
const noChangelog = args.includes('--no-changelog');
const filtered = args.filter((a) => a !== '--no-changelog');

if (filtered.length === 0) {
  console.log(formatVersion(readVersion()));
  process.exit(0);
}

let next;
const cmd = filtered[0];
if (cmd === 'set') {
  if (!filtered[1]) throw new Error('Usage: bump-version.cjs set 1.2.3');
  next = setVersion(filtered[1]);
} else if (['patch', 'minor', 'major'].includes(cmd)) {
  next = bump(cmd);
} else {
  throw new Error(`Usage: bump-version.cjs [patch|minor|major|set VERSION]`);
}

fs.writeFileSync(versionFile, `${next}\n`, 'utf8');
syncPackageJson(next);
if (!noChangelog) {
  appendChangelog(next);
}

console.log(next);
