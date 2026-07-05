# OOSM E2E tests (Playwright)

End-to-end tests for OOSM frontend flows, including mobile bottom navigation and dashboard card view.

## Prerequisites

1. **Smoke only (no backend):** Playwright starts the app automatically (`ng serve` locally, or serves `dist/ui` in CI).
2. **Authenticated tests:** Backend on `http://localhost:8084` and a valid user (default `oosmAdmin` / `osmAdmin123`).

Install browsers once:

```bash
cd osm-ms-fe
npm run e2e:install
```

## Quick run (automated)

**Windows (PowerShell):**

```powershell
cd osm-ms-fe
.\e2e\scripts\run-e2e.ps1 -Suite smoke      # branding only
.\e2e\scripts\run-e2e.ps1 -Suite mobile      # mobile nav + cards (needs BE)
.\e2e\scripts\run-e2e.ps1 -Suite full        # all authenticated tests
.\e2e\scripts\run-e2e.ps1 -Suite all        # smoke then full
```

**Linux / macOS:**

```bash
cd osm-ms-fe
chmod +x e2e/scripts/run-e2e.sh
./e2e/scripts/run-e2e.sh smoke
./e2e/scripts/run-e2e.sh mobile
./e2e/scripts/run-e2e.sh full
```

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run e2e:install` | Install Playwright Chromium |
| `npm run e2e:smoke` | Login page branding (no backend) |
| `npm run e2e:mobile` | Mobile bottom nav + dashboard cards |
| `npm run e2e:full` | Full suite (all spec files) |
| `npm run e2e` | Same as full suite |

## Manual run

```bash
cd osm-ms-fe

# Smoke (no backend)
npm run e2e:smoke

# Mobile experience (FE + BE)
$env:E2E_RUN_LOGIN=1   # PowerShell
# export E2E_RUN_LOGIN=1   # bash
npm run e2e:mobile

# Full authenticated suite
$env:E2E_RUN_LOGIN=1
npm run e2e:full
```

Playwright auto-starts the frontend when it is not already running on port 4200.

## Test files

| File | Scope |
|------|--------|
| `smoke.spec.ts` | Login page branding, login, help |
| `mobile-experience.spec.ts` | Bottom nav, dashboard cards, config toggles |
| `reception.spec.ts` | Reception dashboard, olive/oil lists, suppliers, QC, machines |
| `navigation.spec.ts` | All main modules + welcome + help workflows |
| `cross-module.spec.ts` | Help links, reception→finance→storage journey |

## Helpers

| File | Purpose |
|------|---------|
| `helpers/auth.ts` | Login and authenticated shell checks |
| `helpers/theme-config.ts` | Seed/persist theme config for mobile UI tests |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `E2E_BASE_URL` | http://localhost:4200 | Frontend URL |
| `E2E_USERNAME` | oosmAdmin | Login user |
| `E2E_PASSWORD` | osmAdmin123 | Login password |
| `E2E_RUN_LOGIN` | unset | Set to `1` to run authenticated tests |
| `CI` | unset | Serves built `dist/ui` instead of `ng serve` |

## CI

Frontend CI runs **smoke tests** after production build (no backend required). Authenticated suites stay opt-in via `E2E_RUN_LOGIN=1` locally or in a dedicated pipeline job.

## Reports

On failure, Playwright saves trace, screenshot, and video under `test-results/`. In CI, an HTML report is generated under `playwright-report/`.
