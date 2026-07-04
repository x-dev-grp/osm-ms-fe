# OOSM frontend versioning

Same rules as the backend — keep **identical version numbers and tags** on both repos for each client release.

## Branches

| Branch | Purpose |
|--------|---------|
| `feature/*` | Features — CI only, no version bump |
| `develop` | Integration / UAT |
| `main` | Production releases |

## Commits

```
feat(equipment): equipment dashboard
fix(finance): transaction link
```

## Commands

```bash
npm run version:show
npm run version:patch
npm run version:minor
npm run version:major
```

Or: `node scripts/version/bump-version.cjs patch`

## Release

1. Merge features into `main`
2. GitHub Actions → **Release** → choose patch/minor/major
3. Tag `v0.2.2` pushed automatically
4. Run the same version on the **backend** repo and deploy both tags together

## Runtime

- UI: `environment.appVersion` (from `package.json` / `VERSION`)
