# OOSM E2E tests (Playwright)

## Prerequisites

1. Backend on http://localhost:8084
2. Frontend on http://localhost:4200 (`npm start`)
3. Valid test user (default `oosmAdmin` / `osmAdmin123`)

Install browsers once: `npx playwright install chromium`

## Run

```bash
cd osm-ms-fe

# Branding-only (no backend)
npm run e2e

# Full suite (login + module flows)
$env:E2E_RUN_LOGIN=1   # PowerShell
# export E2E_RUN_LOGIN=1   # bash
npm run e2e
```

## Test files

| File | Scope |
|------|--------|
| `smoke.spec.ts` | Login page branding, login, help |
| `reception.spec.ts` | Reception dashboard, olive/oil lists, suppliers, QC, machines |
| `navigation.spec.ts` | All main modules + welcome + help workflows |
| `cross-module.spec.ts` | Help links, reception→finance→storage journey |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `E2E_BASE_URL` | http://localhost:4200 | Frontend URL |
| `E2E_USERNAME` | oosmAdmin | Login user |
| `E2E_PASSWORD` | osmAdmin123 | Login password |
| `E2E_RUN_LOGIN` | unset | Set to `1` to run authenticated tests |

## CI note

Login tests are skipped unless `E2E_RUN_LOGIN=1` so CI can run branding smoke without backend.
