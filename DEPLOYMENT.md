# Deployment

Production deployment is Docker-based and documented in the **backend** repository:

- [oosm/deploy/vps/README.md](../oosm/deploy/vps/README.md) (if monorepo checkout)
- Or: https://github.com/x-dev-grp/oosm/tree/main/deploy/vps

## CI/CD in this repo

| Workflow | Purpose |
|----------|---------|
| `.github/workflows/ci.yml` | Lint + production build on PR/push |
| `.github/workflows/docker-publish.yml` | Build and push `ghcr.io/x-dev-grp/osm-frontend` |

VPS deploy is triggered from the **oosm** repo (`Deploy to VPS` workflow) after both images are published.

**Railway testing:** see [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) and backend [RAILWAY_TESTING.md](../oosm/RAILWAY_TESTING.md).

## CI/CD

| Workflow | Trigger | Target |
|----------|---------|--------|
| `ci.yml` | PR / push | Maven verify |
| `docker-publish.yml` | `main` / `release` | GHCR (VPS) |
| `deploy-railway.yml` | `develop` / `testing` | Railway testing |
| `deploy-vps.yml` | Manual | Production VPS |

Railway testing guide: [RAILWAY_TESTING.md](../oosm/RAILWAY_TESTING.md)

## Image

```bash
docker build -t osm-frontend:local \
  --build-arg NG_CONFIG=production \
  --build-arg BASE_HREF=/ \
  --build-arg DEPLOY_URL=/ \
  .

docker run --rm -p 8080:8080 \
  -e BACKEND_URL=http://host.docker.internal:8084 \
  osm-frontend:local
```

The nginx template proxies `/api`, `/oauth2`, `/ws`, and `/actuator` to the backend.
