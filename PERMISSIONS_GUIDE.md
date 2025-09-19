# Routing-level permissions in OSM FE

This guide explains how route permissions work and how to add them.

## Permission model

- Format: `MODULE:ENTITY:ACTION` (e.g., `FINANCE:EXPENSE:APPROVE`).
- Source: Backend seeds permissions (see `OSM PROJECT/osm-prod/.../insert Permissions.sql`). The JWT contains the user's `authorities` array.
- Admin bypass: Users with role `Admin` bypass all permission checks.

## Frontend building blocks

- `AuthenticationService`
  - `hasPermission(key: string)`
  - `hasAnyPermission(keys: string[])`
  - `hasAllPermissions(keys: string[])`
  - `isAdmin()`
- Guards in `src/app/interceptors/guards/permission.guard.ts`
  - `allPermissionGuard([...])`: requires ALL permissions (or Admin) → allows; else redirects to `/access-denied`.
  - `anyPermissionGuard([...])`: requires ANY permission (or Admin) → allows; else redirects to `/access-denied`.

Note: anyPermissionGuard was corrected to use `hasAnyPermission` and standardized to redirect to `/access-denied`.

### Enums and helper

See `src/app/theme/types/permissions.ts`.

```ts
import { OSMModule, FinanceEntity, Action, permissionKey } from 'src/app/theme/types/permissions';

// Build a permission string consistently
const key = permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.APPROVE);
```

Use enums in routes for strong consistency and auto-complete.

## How to protect a route

1) Import the guard you need:

```ts
import { allPermissionGuard, anyPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
```

2) Add `canActivate` to the route with the required permission keys:

```ts
import { OSMModule, FinanceEntity, Action, permissionKey } from 'src/app/theme/types/permissions';

// Requires READ on Expenses
{ path: 'expenses', component: ExpensesComponent, canActivate: [allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.READ)])] }

// Visible if user has READ on either Suppliers or Unified Delivery
{ path: 'reception/summary', loadComponent: () => import('./summary.component'), canActivate: [anyPermissionGuard([
  `${OSMModule.RECEPTION}:SUPPLIER:${Action.READ}`,
  `${OSMModule.RECEPTION}:UNIFIEDDELIVERY:${Action.READ}`
])] }
```

3) Use `allPermissionGuard` when all listed permissions are required. Use `anyPermissionGuard` when at least one is sufficient.

## Conventions by page type

- List/detail pages → `...:...:READ`
- Create forms → `...:...:CREATE`
- Edit forms → `...:...:UPDATE`
- Delete flows/pages → `...:...:DELETE`
- Special flows → use the specific action (e.g., `...:VALIDATE`, `...:APPROVE`, `...:PAY`).

## Examples from this codebase

- Finance (see `src/app/finance/finance-routing.module.ts`)
  - Expenses list: `FINANCE:EXPENSE:READ`
  - New expense: `FINANCE:EXPENSE:CREATE`
  - Edit expense: `FINANCE:EXPENSE:UPDATE`
  - Bank accounts list: `FINANCE:BANKACCOUNT:READ`
  - Transactions list/new/edit: `FINANCE:FINANCIALTRANSACTION:{READ|CREATE|UPDATE}`
  - Oil sales list/new/edit: `FINANCE:OILSALE:{READ|CREATE|UPDATE}`

- Storage (see `src/app/storage/storage-routing.module.ts`)
  - Storage units list/view: `PRODUCTION:STORAGEUNIT:READ`
  - New/edit storage unit: `PRODUCTION:STORAGEUNIT:{CREATE|UPDATE}`
  - Oil transactions list/view/new/edit: `PRODUCTION:OILTRANSACTION:{READ|CREATE|UPDATE}`
  - Validate transaction: `PRODUCTION:OILTRANSACTION:VALIDATE`

- HR (see `src/app/hr/hr-routing.module.ts`)
  - Employee list/view/new/edit: `HR:EMPLOYEE:{READ|CREATE|UPDATE}`
  - Department list/new/edit/view: `HR:DEPARTMENT:{READ|CREATE|UPDATE}`
  - Contracts pages: `HR:CONTRACT:{READ|CREATE|UPDATE}`
  - Pointage: `HR:POINTAGE:READ`
  - Postes: `HR:POSTE:{READ|CREATE|UPDATE}`

- Settings (see `src/app/settings/settings-routing.module.ts`)
  - Application configuration: `HABILITATION:PARAMETER:READ`
  - Generic types list: `PRODUCTION:base_type:READ`
  - New/edit generic type: `PRODUCTION:base_type:{CREATE|UPDATE}`
  - Users dashboard/add/edit/view: `HABILITATION:OSMUSER:{READ|CREATE|UPDATE|READ}`
  - Roles dashboard/add/edit/view: `HABILITATION:ROLE:{READ|CREATE|UPDATE|READ}`

## UI visibility (optional but recommended)

Use `AuthenticationService` in templates/components to hide actions the user cannot perform:

```html
<button *ngIf="auth.hasPermission('FINANCE:EXPENSE:CREATE')">New Expense</button>
```

```ts
constructor(public auth: AuthenticationService) {}

get canApproveExpense(): boolean {
  return this.auth.hasPermission('FINANCE:EXPENSE:APPROVE');
}
```

## Troubleshooting

- If a user is redirected to `/access-denied`, verify:
  - The JWT `authorities` contains the exact permission key(s)
  - The module/entity/action names match the backend seed exactly
  - Admin role should always pass via `isAdmin()`


