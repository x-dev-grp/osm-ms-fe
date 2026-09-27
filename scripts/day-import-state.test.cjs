const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the real component methods without bootstrapping unrelated application providers.
const source = fs.readFileSync('src/app/reception/import/reception-import-wizard.component.ts', 'utf8');
const ast = ts.createSourceFile('wizard.ts', source, ts.ScriptTarget.Latest, true);
const cls = ast.statements.find(ts.isClassDeclaration);
const names = new Set(['onFileSelected', 'runDryRun', 'commit', 'checkOutcome', 'retryCommit', 'applyCommitResult', 'fail', 'driveResultLabel']);
const methods = cls.members
  .filter((m) => m.name && names.has(m.name.getText(ast)))
  .map((m) => m.getText(ast))
  .join('\n');
const compiled = ts.transpileModule(`class Wizard {${methods}}; globalThis.Wizard=Wizard;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 }
}).outputText;
const context = {};
vm.runInNewContext(compiled, context);
function fixture() {
  const w = new context.Wizard();
  const requests = [];
  const commits = [];
  const messages = [];
  Object.assign(w, {
    state: 'selected',
    selectionVersion: 0,
    selectedFile: null,
    report: null,
    committing: false,
    dryRunning: false,
    translate: { instant: (k) => k },
    snackBar: { open: (m) => messages.push(m) },
    importService: {
      dryRun: (file) => ({ subscribe: (handlers) => requests.push({ file, handlers }) }),
      commit: (file, id) => ({ subscribe: (handlers) => commits.push({ file, id, handlers }) }),
      run: (id) => ({ subscribe: (handlers) => {} })
    }
  });
  return { w, requests, commits, messages };
}
const select = (w, name) => w.onFileSelected({ target: { files: [{ name }] } });
const preview = { runId: 'preview-1', outcome: 'PREVIEW', canCommit: true, invalidCount: 0, rows: [] };
function validated(f) {
  select(f.w, 'A.xlsx');
  f.w.runDryRun();
  f.requests[0].handlers.next({ ...preview });
}

test('late response for A cannot enable commit of B', () => {
  const f = fixture();
  select(f.w, 'A.xlsx');
  f.w.runDryRun();
  select(f.w, 'B.xlsx');
  f.requests[0].handlers.next({ ...preview });
  f.w.commit();
  assert.equal(f.w.report, null);
  assert.equal(f.commits.length, 0);
});
test('commit carries reviewed run identity and ignores double click', () => {
  const f = fixture();
  validated(f);
  f.w.commit();
  f.w.commit();
  assert.equal(f.commits.length, 1);
  assert.equal(f.commits[0].id, 'preview-1');
  assert.equal(f.commits[0].file.name, 'A.xlsx');
});
test('error-bearing result does not announce success', () => {
  const f = fixture();
  validated(f);
  f.w.commit();
  f.commits[0].handlers.next({ ...preview, outcome: 'REJECTED', invalidCount: 1 });
  assert.equal(f.w.state, 'failed');
  assert.ok(!f.messages.includes('ABIOOC.DAY_IMPORT.COMMIT_OK'));
});
test('successful commit cannot be submitted twice', () => {
  const f = fixture();
  validated(f);
  f.w.commit();
  f.commits[0].handlers.next({ ...preview, outcome: 'COMMITTED' });
  f.w.commit();
  assert.equal(f.w.state, 'committed');
  assert.equal(f.commits.length, 1);
});
test('network error preserves unknown outcome and prevents a new upload', () => {
  const f = fixture();
  validated(f);
  f.w.commit();
  f.commits[0].handlers.error({ status: 0 });
  select(f.w, 'B.xlsx');
  assert.equal(f.w.state, 'unknown');
  assert.equal(f.w.selectedFile.name, 'A.xlsx');
});
test('XLS files are rejected before validation', () => {
  const f = fixture();
  select(f.w, 'A.xls');
  f.w.runDryRun();
  assert.equal(f.requests.length, 0);
  assert.equal(f.w.selectedFile, null);
});

test('retry after a lost response reuses the same preview identity', () => {
  const f = fixture(); validated(f); f.w.commit(); f.commits[0].handlers.error({ status: 0 }); f.w.retryCommit();
  assert.equal(f.commits.length, 2); assert.equal(f.commits[1].id, 'preview-1'); assert.equal(f.commits[1].file.name, 'A.xlsx');
});
