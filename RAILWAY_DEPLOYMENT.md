# Railway deployment

## Service

Deploy the `osm-ms-fe` directory as a Railway service. The included `railway.json` forces Dockerfile builds.

## Required variable

Set this Railway variable on the frontend service:

```text
BACKEND_URL=https://<backend-service-domain>
```

The Angular production build uses same-origin API paths. Nginx forwards `/api/*` and `/oauth2/*` to `BACKEND_URL`.

The frontend can keep Railway's generated URL. No Angular rebuild is needed when Railway assigns the frontend domain because production uses relative paths:

```text
apiUrl=''
apiAuth=''
```

Set these variables on the backend service after Railway gives the frontend URL:

```text
FRONTEND_ENTRY_POINT=https://<frontend-service-domain>
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://<frontend-service-domain>,https://*.up.railway.app
```

## Build

Railway uses:

```text
Dockerfile
```

The Dockerfile runs:

```text
npm ci --force
npm run build -- -c=production --base-href=/ --deploy-url=/
```

and serves `dist/ui` with Nginx on Railway's `$PORT`.

## Local verification

```bash
npm run build -- --configuration production
```
