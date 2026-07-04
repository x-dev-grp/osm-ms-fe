# Railway deployment (testing)

Full stack guide (backend + Postgres + variables): **[../oosm/RAILWAY_TESTING.md](../oosm/RAILWAY_TESTING.md)** in the backend repo.

## This service

Deploy the **`osm-ms-fe`** root as a Railway service. Railway reads:

- `Dockerfile` — multi-stage Angular build + nginx
- `railway.json` — Dockerfile builder, health check `/`

## Required variable

```text
BACKEND_URL=https://<your-backend-service>.up.railway.app
```

Nginx proxies:

- `/api/`, `/oauth2/`, `/.well-known/`, `/jwks`, `/actuator/`

Production Angular uses relative URLs (`environment.apiUrl = ''`), so the app works on any Railway frontend domain without rebuild.

## After deploy

Update the **backend** service:

```text
FRONTEND_ENTRY_POINT=https://<your-frontend>.up.railway.app
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://<your-frontend>.up.railway.app,https://*.up.railway.app
```

## GitHub Actions

`.github/workflows/deploy-railway.yml` deploys on push to `develop` / `testing`.

Secrets (environment **`railway-test`**):

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway project token |
| `RAILWAY_SERVICE_ID` | This frontend service UUID |
| `RAILWAY_ENVIRONMENT_NAME` | Optional, e.g. `testing` |

## Env template

See [`.env.railway.example`](.env.railway.example).

Support tickets are built into OOSM — no third-party keys required. See [docs/technical/support-tickets.md](../docs/technical/support-tickets.md).

## Local build check

```bash
npm ci --force
npm run build -- --configuration production
```
