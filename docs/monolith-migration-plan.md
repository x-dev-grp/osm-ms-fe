# OSM Frontend Analysis and Monolith Migration Plan

## Executive Summary

This repository is already a frontend monolith.

- One Angular application
- One bootstrap entrypoint
- One routing shell
- One frontend deployment artifact
- One production web serving layer

The fragmented part is the backend integration model. The frontend calls a single base URL, but the API surface is split into many domain namespaces that reflect a microservice-style backend or a gateway-fronted distributed architecture.

Target state:

- Monolithic backend application
- Existing frontend retained as a single SPA
- Single deployable backend
- Single database
- Internal domain modules instead of remote service boundaries

## Evidence From the Repository

### Frontend Runtime Shape

- Angular 19 stack with one app build in [package.json](/c:/osm-ms-fe/package.json:5)
- Single app bootstrap in [src/main.ts](/c:/osm-ms-fe/src/main.ts:29)
- Single application router in [src/app/app-routing.module.ts](/c:/osm-ms-fe/src/app/app-routing.module.ts:15)
- Single production container build in [Dockerfile](/c:/osm-ms-fe/Dockerfile:1)
- Single Nginx site config in [nginx.conf](/c:/osm-ms-fe/nginx.conf:1)

### Backend Integration Shape

- Development points to `http://localhost:8084` in [src/environments/environment.ts](/c:/osm-ms-fe/src/environments/environment.ts:7)
- Production uses same-origin API calls and references a gateway container in [src/environments/environment.prod.ts](/c:/osm-ms-fe/src/environments/environment.prod.ts:3)
- Auth token endpoint is built from environment config in [src/environments/environment.ts](/c:/osm-ms-fe/src/environments/environment.ts:13) and [src/environments/environment.prod.ts](/c:/osm-ms-fe/src/environments/environment.prod.ts:10)

### Current Scale

- 482 TypeScript files
- 213 HTML files
- 227 SCSS files
- 60 `*.service.ts` files
- 201 standalone components
- 29 `NgModule`s
- 247 route entries

### Top-Level Domain Folders

- `administration`
- `analytics`
- `auth`
- `configuration`
- `finance`
- `hr`
- `interceptors`
- `labels`
- `OF`
- `projet`
- `reception`
- `settings`
- `shared`
- `stock`
- `storage`
- `theme`
- `welcome`

### API Namespace Spread

Observed API prefixes in the frontend:

- `/api/production`
- `/api/inventaire`
- `/api/security`
- `/api/ordreConditionement`
- `/api/finance`
- `/api/hr`
- `/api/analytics`
- `/api/search`
- `/api/qr`
- `/api/unified-deliveries`
- `/api/expeditions`
- `/api/certifications`

This confirms multiple domain backends or at minimum a gateway-era namespace model.

## Architectural Findings

### 1. Frontend Is Already a Monolith

The application runs as one SPA with one app shell and one root router:

- [src/main.ts](/c:/osm-ms-fe/src/main.ts:29)
- [src/app/app-routing.module.ts](/c:/osm-ms-fe/src/app/app-routing.module.ts:22)

The current frontend architecture is not microfrontend-based.

### 2. Boundaries Exist at Route Level, Not at Code Ownership Level

The app has many feature routes, but domain ownership is weak. Example:

- `stock` routes also import `projet` client pages in [src/app/stock/stock-routing.module.ts](/c:/osm-ms-fe/src/app/stock/stock-routing.module.ts:17)
- `reception` routes aggregate many mixed workflows in [src/app/reception/reception.routes.ts](/c:/osm-ms-fe/src/app/reception/reception.routes.ts:26)

This is a routed modular monolith, not a clean modular monolith.

### 3. Cross-Domain Coupling Is High

Representative examples:

- Project form depends on stock models and services in [src/app/projet/pages/projets/projet-form/projet-form.component.ts](/c:/osm-ms-fe/src/app/projet/pages/projets/projet-form/projet-form.component.ts:10)
- Reception supplier payment history depends on finance services and finance models in [src/app/reception/suppliers/supplier-payment-history/supplier-payment-history.component.ts](/c:/osm-ms-fe/src/app/reception/suppliers/supplier-payment-history/supplier-payment-history.component.ts:21)
- Storage oil transactions depend on finance PDF config and finance sale services in [src/app/storage/oil-transactions/oil-transactions.component.ts](/c:/osm-ms-fe/src/app/storage/oil-transactions/oil-transactions.component.ts:24)

This coupling is the main obstacle to a disciplined monolith.

### 4. Cross-Cutting Concerns Are Already Centralized

Authentication, token refresh, tenant propagation, and request interception are centralized:

- [src/app/auth/services/authentication.service.ts](/c:/osm-ms-fe/src/app/auth/services/authentication.service.ts:16)
- [src/app/interceptors/auth.interceptor.ts](/c:/osm-ms-fe/src/app/interceptors/auth.interceptor.ts:8)
- [src/app/interceptors/error.interceptor.ts](/c:/osm-ms-fe/src/app/interceptors/error.interceptor.ts:11)

This is good. It should remain centralized in the monolith target.

### 5. Build Is Stable but Heavy

Current baseline:

- `npm run build` succeeds
- Initial bundle size is 6.20 MB
- Budget exceeded by roughly 960 KB
- Large lazy chunks exist for stock, projet, labels, and OF
- Sass deprecation warnings are widespread
- CommonJS optimization bailouts exist

This is not a migration blocker, but it is technical debt that will slow future changes.

## Target Architecture

## Goal

Replace backend service fragmentation with a modular monolith while keeping the frontend as one SPA.

## Target Backend Shape

One deployable backend application with internal modules:

1. `security`
2. `administration`
3. `reception`
4. `inventory`
5. `conditioning`
6. `storage`
7. `finance`
8. `hr`
9. `reporting`
10. `shared-kernel`

Rules:

- No network calls between internal modules
- No independent service deployments
- One relational database
- Strict ownership of tables per module
- Shared contracts only through explicit interfaces

## Target Frontend Shape

Keep one SPA, but strengthen boundaries:

1. One shell
2. One auth model
3. One API access layer per domain
4. No direct feature-to-feature page imports
5. Shared UI and shared contracts only in `shared`
6. Domain lazy loading remains in place

## Domain Mapping

Current repository domains mapped to target monolith domains:

| Current Area | Target Domain |
| --- | --- |
| `auth`, user/role/permission parts of `settings` | `security` |
| `administration`, company profile, app setup | `administration` |
| `reception`, suppliers, deliveries, quality intake | `reception` |
| `stock` | `inventory` |
| `OF`, `labels`, production-specific parts of analytics | `conditioning` |
| `storage` | `storage` |
| `finance` | `finance` |
| `hr` | `hr` |
| analytics reports, PDFs, exports | `reporting` |
| reusable contracts, enums, common primitives | `shared-kernel` |

## Migration Strategy

### Strategy Choice

Use modular consolidation, not full rewrite.

Reason:

- The frontend already works
- Auth and routing are already centralized
- Domain flows already exist
- The risk is boundary cleanup and backend consolidation, not product definition

### Core Principle

First clean interfaces. Then collapse deployments.

If deployment consolidation happens before interface cleanup, the result will be one large tangled codebase instead of a modular monolith.

## Execution Plan

### Phase 0: Stabilize Baseline

Objective:

Create a reliable starting point before structural changes.

Tasks:

1. Freeze new architectural patterns during migration.
2. Record current route map and API map.
3. Save current build baseline and bundle sizes.
4. Mark known warnings:
   - bundle budget overage
   - Sass deprecations
   - CommonJS bailouts
5. Protect the current auth flow with regression tests.

Deliverables:

- Route inventory
- Endpoint inventory
- Build baseline report
- Critical user-flow checklist

Exit criteria:

- Baseline build stays green
- No untracked architectural expansion during migration

### Phase 1: Build Domain Inventory

Objective:

Map all business capabilities to explicit domain ownership.

Tasks:

1. Classify every route under one target domain owner.
2. Classify every service and API endpoint under one target domain owner.
3. Mark shared models that are actually domain-owned.
4. Mark illegal or undesirable cross-domain imports.
5. Define ownership rules for:
   - suppliers
   - deliveries
   - stock
   - conditioning orders
   - projects
   - payments
   - storage units
   - reports

Deliverables:

- Domain ownership matrix
- Import violation list
- API ownership matrix

Exit criteria:

- Every feature and endpoint has one owner

### Phase 2: Introduce Frontend Boundary Rules

Objective:

Turn the current frontend monolith into a disciplined modular monolith.

Tasks:

1. Create per-domain `data-access`, `feature`, and `ui` layers.
2. Move raw HTTP calls behind domain API clients.
3. Move shared DTOs and primitives into a shared contracts area only when truly shared.
4. Ban direct imports from one feature page/component into another domain feature page/component.
5. Add ESLint path rules for module boundaries.
6. Replace broad `shared` dumping with owned modules plus a smaller shared kernel.

Priority refactors:

1. Remove `projet` client pages from `stock` routing.
2. Decouple `projet` from direct `stock` implementation imports where facade APIs are enough.
3. Decouple `reception` supplier payment flow from direct finance implementation details.
4. Decouple `storage` oil transactions from finance-owned PDF and sale logic.

Deliverables:

- Domain API client layer
- Import boundary rules
- First-wave coupling reductions

Exit criteria:

- No direct feature page imports across domains
- Feature code no longer constructs raw API URLs directly

### Phase 3: Define Backend Modular Monolith

Objective:

Design the backend target before moving runtime responsibilities.

Tasks:

1. Define backend modules matching target domains.
2. Define module public interfaces.
3. Define entity ownership and table ownership.
4. Define transaction boundaries.
5. Define cross-module communication style:
   - direct service calls for synchronous flows
   - internal domain events for decoupled flows
6. Decide multitenancy strategy:
   - keep current tenant semantics if required
   - remove fake or redundant tenant propagation if not required

Deliverables:

- Package/module structure
- Entity ownership map
- Transaction design
- Domain event list

Exit criteria:

- Backend target architecture is explicit and internally coherent

### Phase 4: Consolidate Security and Administration

Objective:

Move the most central cross-cutting services first.

Tasks:

1. Merge auth, user, role, permission, company profile, and basic administration into the monolith.
2. Preserve current JWT and refresh flow semantics.
3. Preserve permission key behavior used by route guards.
4. Terminate auth in the monolith instead of a separate service boundary.

Reference frontend dependencies:

- [src/app/auth/services/authentication.service.ts](/c:/osm-ms-fe/src/app/auth/services/authentication.service.ts:99)
- [src/app/interceptors/auth.interceptor.ts](/c:/osm-ms-fe/src/app/interceptors/auth.interceptor.ts:19)
- [src/app/interceptors/error.interceptor.ts](/c:/osm-ms-fe/src/app/interceptors/error.interceptor.ts:24)

Deliverables:

- Security module
- Administration module
- Stable token lifecycle in monolith backend

Exit criteria:

- Login, refresh, logout, permission checks unchanged from user perspective

### Phase 5: Consolidate Inventory and Conditioning

Objective:

Collapse the most structurally connected business areas first.

Reason:

`projet`, `OF`, and stock already depend on one another. These should not remain remotely separated.

Tasks:

1. Merge inventory APIs into one internal inventory module.
2. Merge OF and label/conditioning APIs into one conditioning module.
3. Move BOM, SKU, stock validation, line assignment, and production order checks into in-process services.
4. Keep reporting endpoints separate logically but backed by the same backend.

Deliverables:

- Inventory module
- Conditioning module
- Shared internal workflow between inventory and conditioning

Exit criteria:

- No remote boundary remains between inventory and conditioning workflows

### Phase 6: Consolidate Reception and Storage

Objective:

Collapse intake, delivery, storage, and traceability flows into one runtime.

Tasks:

1. Merge reception delivery flows.
2. Merge storage unit and oil transaction flows.
3. Preserve genealogy, traceability, and quality control interactions.
4. Replace remote orchestration with local service orchestration.

Deliverables:

- Reception module
- Storage module
- Unified traceability flow

Exit criteria:

- Delivery-to-storage workflows execute entirely within the monolith

### Phase 7: Consolidate Finance

Objective:

Keep finance internally separate but runtime-local.

Tasks:

1. Merge bank accounts, expenses, transactions, oil credit, oil sales, waste sales.
2. Replace remote finance calls from reception and storage with local service calls.
3. Centralize payment workflow and invoice/PDF generation policy.

Deliverables:

- Finance module
- Standard internal payment interfaces

Exit criteria:

- Supplier payments, oil sales, waste sales, and transaction approval no longer cross service boundaries

### Phase 8: Consolidate HR and Reporting

Objective:

Finish remaining service splits and isolate reporting concerns.

Tasks:

1. Merge HR into the monolith.
2. Move analytics and reporting to a dedicated reporting module.
3. Centralize PDF/export generation.
4. Remove duplicate reporting logic scattered across features.

Deliverables:

- HR module
- Reporting module

Exit criteria:

- All current business capabilities run under one backend process

### Phase 9: Remove Gateway-Era Indirection

Objective:

Simplify deployment after consolidation.

Tasks:

1. Remove service discovery assumptions.
2. Remove backend-to-backend HTTP routing logic.
3. Keep reverse proxy only for ingress, TLS, caching, and SPA hosting.
4. Simplify environment configuration.

Target production model:

- One frontend deployment
- One backend deployment
- One reverse proxy
- One database

Deliverables:

- Simplified infra topology
- Simplified runtime config

Exit criteria:

- No internal runtime dependency requires a service gateway

### Phase 10: Hardening and Optimization

Objective:

Pay down the technical debt exposed by consolidation.

Tasks:

1. Reduce initial bundle size.
2. Remove dead imports in standalone components.
3. Fix Sass deprecated `@import`, `darken`, `map-get`, and global built-in usage.
4. Replace avoidable CommonJS dependencies or isolate them.
5. Add domain regression tests.
6. Add architectural tests for module boundaries.

Deliverables:

- Reduced build warnings
- Bundle budget compliance plan
- Regression suite

Exit criteria:

- Architecture is stable enough for normal feature delivery

## Recommended Migration Order

Order:

1. `security`
2. `administration`
3. `inventory`
4. `conditioning`
5. `reception`
6. `storage`
7. `finance`
8. `hr`
9. `reporting`

Reason:

- Security is foundational.
- Inventory and conditioning are already tightly connected.
- Reception and storage depend on those operational flows.
- Finance consumes many upstream operational outcomes.

## Deliverables by Workstream

### Architecture

- Domain map
- Module ownership rules
- Import boundary rules
- Backend package structure

### Frontend

- Domain API clients
- Refactored feature boundaries
- Reduced cross-domain imports
- Bundle reduction plan

### Backend

- Single deployable monolith
- Internal module interfaces
- One database ownership map
- Internal transaction model

### DevOps

- Simplified runtime topology
- Simplified environment config
- Deployment cutover plan

### Quality

- Regression test suite
- Auth and permission test suite
- Cross-domain workflow tests
- Architecture conformance checks

## Acceptance Criteria

The migration is complete when all conditions are true:

1. The backend is one deployable application.
2. The frontend remains one SPA.
3. No internal business flow depends on backend-to-backend HTTP calls.
4. One database backs all modules.
5. Every table and entity has one owning domain.
6. Frontend features do not import other domains’ feature pages/components directly.
7. Frontend HTTP access is mediated through domain API layers.
8. Auth refresh, tenant propagation, and permission behavior remain correct.
9. Route behavior remains consistent for existing users.
10. Build remains green.

## Major Risks

### Risk 1: Hidden Domain Coupling

The visible frontend coupling strongly suggests backend coupling is also high.

Mitigation:

- Build domain inventory first
- Migrate by dependency order
- Use internal contracts, not direct database shortcuts

### Risk 2: Shared Folder Overgrowth

The current `shared` area is large and likely mixes true shared code with displaced domain code.

Mitigation:

- Audit `shared`
- Move domain-owned code back to owning modules
- Keep only stable contracts and generic UI in shared

### Risk 3: Frontend Refactor Churn

Boundary cleanup will touch many imports.

Mitigation:

- Enforce path rules early
- Refactor by domain slice
- Avoid simultaneous feature work in affected domains

### Risk 4: Bundle and Build Regression

Consolidation may worsen bundle size if boundaries are not maintained.

Mitigation:

- Preserve lazy loading
- Track bundle metrics per phase
- Remove unused imports and dead code as part of each slice

### Risk 5: Data Ownership Confusion

Multiple services often imply duplicated source-of-truth assumptions.

Mitigation:

- Define ownership before merge
- Use explicit read models where needed
- Avoid cross-domain writes without defined service orchestration

## Immediate Action Plan

### First 2 Weeks

1. Produce complete route-to-domain map.
2. Produce complete endpoint-to-domain map.
3. Produce cross-domain import report.
4. Define target backend module structure.
5. Add frontend module-boundary lint rules.

### Next 2 to 4 Weeks

1. Introduce domain API facade layer.
2. Refactor the highest-risk coupling points:
   - stock <-> projet
   - projet <-> stock
   - reception <-> finance
   - storage <-> finance
3. Lock shared contract locations.

### Next 1 to 2 Months

1. Consolidate security and administration.
2. Consolidate inventory and conditioning.
3. Consolidate reception and storage.
4. Consolidate finance.
5. Consolidate HR and reporting.

### Final Hardening

1. Remove gateway-era indirection.
2. Reduce bundle size.
3. Fix Sass deprecations.
4. Expand regression coverage.

## Final Recommendation

Do not treat this as a frontend monolith conversion. That part is already done.

Treat it as:

1. Frontend boundary cleanup
2. Backend modular monolith consolidation
3. Infrastructure simplification

The correct target is a modular monolith, not an unstructured monolith. The existing repository already contains the domain map needed to do this, but the current code boundaries are porous. Boundary discipline must be enforced before or alongside backend consolidation.
