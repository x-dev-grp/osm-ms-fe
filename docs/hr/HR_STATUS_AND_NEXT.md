# HR & Payroll — Status & Next Steps (Frontend)

**Repo:** `osm-ms-fe`  
**Branch:** `feature/hr-payroll-module`  
**Paired backend:** `oosm` → same branch name  
**Last updated:** 2026-07-26

---

## 1. What we were working on

Angular (Able Pro) UI for the expanded **Tunisian HR / Payroll** domain implemented in the OSM backend (`oosm` / `modules/hr`).

### Goals

- Full HR navigation: organization, time, leave, payroll, settings, compliance, agent  
- Reuse existing patterns: `HrEntityListComponent`, dashboard configs, nested DTOs `{ employee: { id } }`  
- KPI dashboard from `/api/hr/dashboard/stats`  
- Stop treating frontend Tunisian rate constants as payroll authority  

### Architectural decision

Work stays inside `src/app/hr` with lazy `/hr` routes and `moduleGuard(HR)`. No parallel HR app.

Backend docs (source of truth for domain): `oosm/docs/hr/*`.

---

## 2. What was delivered (frontend)

### 2.1 Extended existing screens

- Employees (new fields: employee number, gender, marital status, tax/RIB, etc.)  
- Contracts (CDD legal reason, base salary, weekly hours, probation, contract number)  
- Payslips (display backend-calculated fields; preview constants marked provisional)  
- HR dashboard (KPI cards + quick nav)  

### 2.2 New list/form entities (registry-driven)

| Area | Routes (under `/hr/…`) |
|------|-------------------------|
| Organization | `departments`, `grades` |
| Time | `work-schedules`, `timesheets`, `overtime-requests` |
| Leave config | `leave-types`, `public-holidays` |
| Payroll extras | `payroll-variables`, `salary-advances`, `employee-loans` |
| Documents | `employee-documents` |
| Legal settings | `legal-rules`, `social-security-configs`, `tax-configurations`, `minimum-wage-rules`, `salary-components` |

Wired via:

- `config/hr-list-registry.ts`  
- `*-dashboard.config.ts`  
- services + models + form components  
- `hr-routing.module.ts` + `theme/types/permissions.ts` + `oosm_menu.ts`  
- i18n: `en` / `fr` / `ar`  

### 2.3 Special pages

| Route | Purpose |
|-------|---------|
| `/hr/settings` | Hub to legal / CNSS / tax / SMIG / components / company profile |
| `/hr/company-legal-profile` | Company HR legal profile form |
| `/hr/compliance` | Summary + scan |
| `/hr/agent` | Prompt UI + confirmation checkbox for write/critical actions |

Ops API client: `services/hr-ops.service.ts` → dashboard / compliance / agent.

### 2.4 Related non-HR UI also on this branch

This branch may also include branding / PWA / settings / layout updates that were already in the working tree when the HR work was committed. Review the PR diff carefully if you want an HR-only merge.

---

## 3. How to run / smoke-test (frontend)

```powershell
cd osm-ms-fe
npm install   # or yarn
ng serve
```

With backend on `:8084` and HR module enabled:

1. Login as HR role (or admin)  
2. Open `/hr` — KPIs should load  
3. Seed legal defaults from backend (or settings UI once available)  
4. Employees → Contracts → Payroll periods → Payslips  
5. `/hr/compliance` → Scan  
6. `/hr/agent` → e.g. “show missing CNSS” / “pending leave”  

### Important UX rule

**Do not trust FE-only CNSS/IRPP math for payroll.**  
`tunisia-hr.constants.ts` / `hr-payroll.utils.ts` are provisional helpers only. Payslip amounts come from the backend engine.

---

## 4. What's next (frontend priority)

### P0 — Align with backend production readiness

| Item | Why |
|------|-----|
| Verify every new list against live API + permissions | Catch 403 / missing entity keys |
| Empty / loading / error states polish on compliance & agent | Spec UX requirements |
| Confirm CDD reason required in contract form when type is CDD/seasonal/temporary | Match `ContractLegalValidator` |
| Seed / settings entry points discoverable in UI | Call out `seed-defaults` for admins |

### P1 — Feature depth

| Item | Why |
|------|-----|
| Employee detail tabs (overview, contract, payroll, attendance, leave, payslips, advances, loans, documents, history) | Spec §4 detail page |
| Timesheet validate + overtime approve actions in UI | Backend endpoints exist |
| Payroll period review screen (anomalies, totals, validate/close) | Closer to full payroll workflow |
| Payslip breakdown viewer from `calculationBreakdown` JSON | Explainability / agent parity |
| Advances/loans status workflows (approve / deduct) | Match backend statuses |

### P2 — HR Agent + LLM (UI)

| Item | Why |
|------|-----|
| Show `confirmationRequired` clearly when backend asks | Already partially wired |
| Chat history persistence (optional) | Better UX |
| When backend adds LLM planner: no FE changes to payroll math | Only richer answers |

LLM note: cloud OpenAI needs an **API key** on the backend, not ChatGPT Plus in the browser.

### P3 — Quality

| Item | Why |
|------|-----|
| E2E (Playwright) for HR happy path | Regression safety |
| Trim unrelated branding/PWA commits if PR should be HR-only | Cleaner review |
| Accessibility / mobile pass on new forms | Able Pro consistency |

---

## 5. Branch / PR notes

- Branch: `feature/hr-payroll-module`  
- Open PR:  
  https://github.com/x-dev-grp/osm-ms-fe/pull/new/feature/hr-payroll-module  
- Merge **with** backend PR on the same branch name so APIs and UI land together.  

### Paired backend checklist (for FE testers)

- [ ] Backend branch deployed / running  
- [ ] `POST /api/hr/legal-rules/seed-defaults` done for tenant  
- [ ] Permissions catalog synced (restart backend after permission JSON changes)  
- [ ] HR module enabled for tenant  

---

## 6. Quick file index

```text
src/app/hr/
  hr-routing.module.ts
  hr-dashboard/
  config/hr-list-registry.ts
  settings/  compliance/  agent/
  departments/ grades/ work-schedules/ timesheets/ …
  services/hr-ops.service.ts
src/app/theme/types/permissions.ts   # HREntity expansions
src/app/shared/oosm_menu.ts
src/assets/i18n/{en,fr,ar}.json
```

This document is the frontend companion to `oosm/docs/hr/HR_STATUS_AND_NEXT.md`.
