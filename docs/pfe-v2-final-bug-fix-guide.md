# PFE v2 Final Regression Fix Guide

## 1. Purpose

This document controls the recovery of fixes discovered after `pfe-v2-final`.

`pfe-v2-final` is the immutable reference branch. Existing audit branches and stashes are evidence sources only. They must not be merged or applied as one bulk change. Every defect is reintroduced independently, verified independently, and committed independently.

The frontend and backend commit for the same defect must use the same defect ID.

## 2. Repositories and baseline

| Application | Repository | Base branch |
|---|---|---|
| Frontend | `osm-ms-fe` | `origin/pfe-v2-final` |
| Backend | `oosm` | `origin/pfe-v2-final` |

Before implementation:

1. Preserve all uncommitted work in a named safety snapshot.
2. Fetch both repositories.
3. Create the recovery branch directly from `origin/pfe-v2-final` in each repository.
4. Record both starting commit SHAs in the execution log.
5. Confirm both working trees are clean.
6. Run the baseline test suites and record existing failures before applying a fix.

Do not delete the audit branches or stashes until final acceptance.

## 3. Commit rules

One commit must contain one defect only.

Commit format:

```text
[DEFECT-ID] Short imperative description
```

Examples:

```text
[PAY-001] Bind payment actions to the selected delivery
[PAY-001] Validate payment against the selected delivery
```

Rules:

- Use the same defect ID in frontend and backend when both are affected.
- Keep tests in the same commit as the behavior they verify.
- Do not combine formatting, documentation, translations, navigation, and business logic in one commit.
- Do not mix generated files unless the defect directly changes their source.
- Do not include local credentials, tokens, database files, screenshots, Playwright output, IDE state, or temporary reports.
- Do not amend an accepted defect commit to include a later unrelated fix.
- Revert a failed candidate fix before starting the next defect.

## 4. Per-defect workflow

For every defect:

1. Reproduce the failure on the clean `pfe-v2-final` baseline.
2. Record the exact route, user role, tenant modules, request, response, and visible result.
3. Inspect the old implementation and the audit/stash implementation.
4. Define the smallest correct behavior.
5. Add a failing automated test.
6. Implement the smallest frontend and/or backend change.
7. Run targeted tests.
8. Run the affected module tests.
9. Perform the listed manual QA scenario.
10. Inspect the staged diff and secret scan.
11. Commit with the assigned defect ID.
12. Push the commit.
13. Record the frontend SHA, backend SHA, test result, and QA evidence.

Allowed status values:

- `TODO`: not started.
- `REPRODUCED`: confirmed on `pfe-v2-final`.
- `IN PROGRESS`: test or implementation underway.
- `AUTOMATED PASS`: targeted automated validation passed.
- `QA PASS`: manual validation passed.
- `BLOCKED`: reproducible blocker recorded.
- `DONE`: committed, pushed, automated tests passed, and manual QA passed.

## 5. Defect inventory

### Payments and supplier balances

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| PAY-001 | Payment action uses stale or incorrect row values | The dialog and request use the delivery selected by the current row, including its ID, price, paid amount, and unpaid amount | FE + BE | Row-action component test; request identity test; cross-delivery rejection test | TODO |
| PAY-002 | Oil and mixed payment methods disappeared | Trituration services support cash, oil, and mixed cash/oil payments according to the original business rules | FE + BE | Payment-method selection tests; oil quantity/value tests; mixed-payment persistence tests | TODO |
| PAY-003 | Partial payments are no longer shown as partially paid | A payment below the remaining balance keeps the delivery open and displays a partial-payment state | FE + BE | Partial-payment service test; payment-status utility/component test | TODO |
| PAY-004 | Paid and unpaid amounts are missing or incorrect | Lists, details, and payment history display persisted paid and unpaid values after reload | FE + BE | Balance calculation tests; DTO mapping tests; history rendering tests | TODO |
| PAY-005 | Repeated and final payments can corrupt the balance | Multiple partial payments accumulate once; the final payment sets unpaid to zero and paid status to true | BE | Multiple-payment, final-payment, retry, and concurrency tests | TODO |
| PAY-006 | Overpayment and invalid amounts are not handled safely | Negative and zero payments are rejected; overpayment follows the approved cap-or-reject rule without excess financial postings | BE | Validation and transaction-posting tests | TODO |
| PAY-007 | Financial transaction metadata is inconsistent | Payment method, transaction type, direction, currency, reference, and tenant match the source operation | BE | Financial port captor tests for every operation and payment method | TODO |
| PAY-008 | Payment mutation service contracts regressed | Frontend endpoints, HTTP verbs, payloads, and backend controller mappings match exactly | FE + BE | Angular service tests; controller mapping tests | TODO |

### Navigation, modules, and permissions

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| NAV-001 | Conditioning inventory entries appear when Conditioning is disabled | Conditioning stock operations, movements, locations, and stock-by-zone entries require the Conditioning module and permission | FE + BE | Menu filtering matrix; permission catalog/seed tests | TODO |
| NAV-002 | Oil filtration is exposed outside Conditioning | Filtration menus, routes, and endpoints require the Conditioning entitlement selected by the product policy | FE + BE | Menu, route guard, and endpoint authorization tests | TODO |
| NAV-003 | Hidden menus remain accessible through direct URLs | Module and permission guards deny direct navigation when the tenant lacks the required entitlement | FE | Guard and routing tests for enabled, disabled, and unresolved session states | TODO |
| NAV-004 | Backend access differs from frontend visibility | Every protected page has an equivalent backend authorization and tenant check | BE | Controller permission tests; unauthorized and cross-tenant integration tests | TODO |
| NAV-005 | OSM menu grouping does not match user workflows | Reception, production, conditioning, inventory, finance, HR, and administration are grouped consistently without duplicated destinations | FE | Menu structure snapshot/assertion tests | TODO |
| NAV-006 | Direction and row actions use ambiguous text | Inbound, outbound, internal, view, edit, validate, delete, and QR regeneration use consistent icons with accessible labels/tooltips | FE | Action model tests and accessibility assertions | TODO |

### Localization

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| I18N-001 | `TRANSACTIONS.TYPES.OIL_SALE_PAYMENT` is displayed as a raw key | English, French, and Arabic dictionaries contain correct human translations | FE | Strict dictionary and rendered-label tests | TODO |
| I18N-002 | Dynamic enum keys are missing silently | Translation audit detects missing transaction types, directions, currencies, payment methods, operation types, quality grades, sale states, actions, and storage states | FE | Translation-audit script tests | TODO |
| I18N-003 | Automatic synchronization inserts empty or source-language placeholders | Missing keys are added structurally, but every generated value must be reviewed in its target language | FE | Empty-value, placeholder, and cross-language equality checks | TODO |
| I18N-004 | Daily-import files ignore the selected language | Template sheets, columns, instructions, dropdowns, error reports, and exports use the requested locale | FE + BE | Locale request tests and workbook-content tests for EN/FR/AR | TODO |
| I18N-005 | Arabic layout or direction is incorrect | Menus, dialogs, tables, action icons, dates, and numbers remain correct in RTL | FE | Direction-sensitive component tests plus manual RTL QA | TODO |

### Storage, filtration, and stock integrity

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| STO-001 | Storage-unit dashboard cards stay light in dark mode | Cards, text, borders, capacity tracks, badges, and statuses use theme tokens in light and dark modes | FE | Production build plus component/style regression assertion | TODO |
| STO-002 | Storage volume can be edited as ordinary metadata | Creation starts at zero and metadata updates cannot overwrite stock-derived volume | FE + BE | Payload test; entity/service protected-field tests | TODO |
| STO-003 | Oil transfers can create invalid balances | Source and target must differ; source must contain enough oil; both balances change exactly once | BE | Transfer rule and rollback tests | TODO |
| STO-004 | Transaction update/delete can repeat stock effects | Only allowed metadata changes; deletion reverses stock once and rejects dependent operations | BE | Update, delete, retry, and dependency tests | TODO |
| FIL-001 | Filtration accepts invalid source/target or quantities | Source and target rules, filtered-oil designation, quantity limits, and tenant ownership are enforced | FE + BE | Form validation and service rule tests | TODO |
| FIL-002 | Filtration dashboard totals do not match operations | Dashboard counts and quantities derive from owned, non-deleted filtration records | BE | Repository/service aggregation tests | TODO |
| STOCK-001 | Conditioning stock routes use main-inventory permissions | Route and API permission ownership match the Conditioning module policy | FE + BE | Route and permission matrix tests | TODO |

### Reception and production lifecycle

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| REC-001 | Reception create routes require update permission | New forms require CREATE; existing forms require UPDATE | FE + BE | Route guard and controller permission tests | TODO |
| REC-002 | Static routes can be interpreted as entity IDs | Routes such as `new`, import, quality, and action pages resolve before parameterized ID routes | FE | Router configuration tests and Playwright navigation tests | TODO |
| REC-003 | Cancellation, deletion, or repricing ignores downstream work | Operations with payments, milling, stock, or dependent records are rejected or reversed according to policy | BE | State-transition and dependency tests | TODO |
| REC-004 | Delivery/lot numbering can collide or leak across tenants | Number allocation is unique, tenant-scoped, deletion-safe, and follows the approved year rule | BE | Concurrency, tenant, deletion, and year-boundary tests | TODO |
| REC-005 | Unified delivery controller mappings or permissions regressed | Mutation endpoints retain their API mappings and enforce the assigned permission | BE | Controller mapping and permission tests | TODO |
| PLAN-001 | Planning completion produces inconsistent state | Completion is idempotent and only valid from approved source states | BE | Completion and retry tests | TODO |
| MNT-001 | Machine availability refresh overwrites operational state | Read/availability calculations do not silently reset maintenance-controlled states | BE | Availability and maintenance-state tests | TODO |

### Quality control

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| QC-001 | Numeric boundaries and tolerance are evaluated incorrectly | Minimum, maximum, equality, precision, and tolerance follow one backend-compatible rule | FE + BE | Boundary and decimal tests on both sides | TODO |
| QC-002 | Boolean and string criteria are accepted inconsistently | Boolean values are exact; string options follow the approved trim/case policy | FE + BE | Boolean/string validation tests | TODO |
| QC-003 | Quality-control routes use the wrong module or permission | List, create, and update routes require the correct Production/QC permissions | FE + BE | Guard and endpoint authorization tests | TODO |
| QC-004 | Result category can contradict measured values | Manual category override follows an explicit policy and cannot silently contradict mandatory limits | BE | Classification and override-policy tests | TODO |

### Authentication, tenancy, and errors

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| AUTH-001 | Guards deny valid deep links before session initialization finishes | Guards wait for the resolved session/module state and fail deterministically | FE | Cold-start, slow-refresh, profile-fallback, and failure tests | TODO |
| AUTH-002 | Password flows leave stale authentication state | Reset/change success clears stored tokens and returns the user to sign-in | FE + BE | Authentication service/component and endpoint tests | TODO |
| TEN-001 | Entity access is not consistently tenant-scoped | Reads, searches, updates, deletes, payments, and exports fail closed outside the active tenant | BE | Tenant-access utility plus controller/service integration tests | TODO |
| ERR-001 | Business refusals return generic server errors | Validation, not-found, forbidden, and conflict cases map to stable HTTP statuses and messages | BE | Exception-handler tests | TODO |

### Daily import, dashboards, and usability

| ID | Defect | Required behavior | Scope | Required automated tests | Status |
|---|---|---|---|---|---|
| IMP-001 | Import-rule acceptance leaks or becomes stale | Acceptance is user-specific and invalidated by a rules-version change | FE | State persistence and version tests | TODO |
| IMP-002 | A stale preview can be committed after replacing the file | Commit is bound to the validated workbook and rejected after file/state changes | FE + BE | State-machine and commit-token tests | TODO |
| IMP-003 | Import retries create duplicates | Commit is transactional and idempotent under refresh, timeout, or repeated submission | BE | Retry, rollback, and duplicate-key tests | TODO |
| IMP-004 | Import errors lack usable location information | Errors identify sheet, row, field, and reason in the selected language | FE + BE | Error DTO and report tests | TODO |
| DASH-001 | Administration dashboard values or DTOs are incomplete | Company, user, support, module adoption, and activity figures match stored data | FE + BE | Service aggregation and frontend mapping tests | TODO |
| DASH-002 | Dashboard shell state is inconsistent | Loading, error, refresh, filters, exports, title actions, and tab state follow one contract | FE | Dashboard shell/service tests | TODO |
| TOUR-001 | Guided tours persist or clean up incorrectly | Tours start once, survive reload, support replay/reset, and remove overlays on close/navigation | FE | Registry and service lifecycle tests | TODO |
| A11Y-001 | Motion and transparency ignore accessibility preferences | Reduced motion and reduced transparency produce readable, stable interfaces | FE | CSS/build checks plus manual OS-preference QA | TODO |

## 6. Implementation order

Use this order because later validation depends on earlier security and data rules:

1. `TEN-001`, `AUTH-001`, `ERR-001`
2. `NAV-001` through `NAV-004`
3. `PAY-001` through `PAY-008`
4. `STO-002` through `STOCK-001`
5. `REC-001` through `MNT-001`
6. `QC-001` through `QC-004`
7. `IMP-001` through `IMP-004`
8. `I18N-001` through `I18N-005`
9. `DASH-001`, `DASH-002`, `TOUR-001`, `A11Y-001`
10. `NAV-005`, `NAV-006`, `STO-001`

Visual-only changes remain separate from functional corrections.

## 7. Automated validation gates

### Frontend targeted gate

Run the affected spec files first. Then run:

```text
npm run i18n:check
npm test -- --watch=false --browsers=ChromeHeadless
npm run build-prod
```

Run Playwright smoke tests after any route, authentication, permission, payment, import, or dashboard change.

### Backend targeted gate

Run the affected module test first. Then run the complete Java 21 reactor:

```text
mvn clean test
mvn package -DskipTests
```

The reactor must reach every module. A build that stops before downstream modules is a failure even when earlier tests pass.

### Cross-application gate

After every defect that spans both repositories:

1. Start the backend against a disposable test database.
2. Start the production-like frontend build.
3. Execute the defect's Playwright scenario.
4. Reload the page and verify persisted values.
5. Inspect browser console, network traffic, backend log, and database effects.

## 8. Manual QA reference

Use [manual-qa-regression-checklist.md](manual-qa-regression-checklist.md) for complete acceptance testing.

Every defect must reference at least one checklist ID. Add a new checklist row when the defect has no existing scenario.

## 9. Execution log

| Defect ID | Frontend SHA | Backend SHA | Automated result | Manual QA ID/result | Notes |
|---|---|---|---|---|---|
| | | | | | |

## 10. Final release gate

Release is blocked until all conditions are true:

- Both recovery branches descend from `origin/pfe-v2-final`.
- Both working trees are clean.
- Every accepted fix has one isolated defect commit.
- Paired frontend/backend commits use the same defect ID.
- No bulk stash or audit commit was merged without decomposition.
- Frontend unit tests pass.
- Frontend production build passes.
- Strict localization audit passes with reviewed translations.
- Complete backend Maven reactor passes.
- Full Playwright suite passes or environment-only skips are documented.
- Payment, module-permission, and tenant-isolation matrices pass.
- Manual QA checklist is signed off.
- Final frontend and backend SHAs are recorded.
- Secret and generated-artifact review passes.

Final decision: `NOT APPROVED`, `APPROVED WITH CONDITIONS`, or `APPROVED`.
