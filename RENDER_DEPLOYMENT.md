# Render Deployment

## ZitFlow (new): Blueprint FE + Postgres

Branch **`pfe-v2-final`** (single production source; `deploy/zitflow-xdev-pro` is an alias tip). Apply [`render.zitflow.yaml`](render.zitflow.yaml) from the Render Dashboard (New → Blueprint). That creates:

- **zitflow-web** — Docker/nginx frontend (`BACKEND_URL` → Railway)
- **zitflow-postgres** — Frankfurt Postgres 17 (restore from `oosm_fawv`)

Domain: **`zitflow.xdev.pro`**. Full steps: [`../oosm/ZITFLOW_RENDER.md`](../oosm/ZITFLOW_RENDER.md).

Do not use the legacy root [`render.yaml`](render.yaml) for this cutover (it still points at the old Render API).

## Hybrid (current prod): Render frontend + Railway backend + Render Postgres

Keep **oosm-web** / **osm-ms-fe-1** on Render and point nginx at the Railway API:

```text
BACKEND_URL=https://<backend>.up.railway.app
```

Template: [`.env.render.railway-api.example`](.env.render.railway-api.example).  
Full guide: [../oosm/RAILWAY_RENDER_DB.md](../oosm/RAILWAY_RENDER_DB.md).

Suspend the old Render `oosm-api` if you want; keep **Postgres** and **oosm-web**.

---

## Full stack on Render

Create the service from the `render.yaml` Blueprint. It defines a Web Service
with the Docker runtime. Do not create a Static Site or a native Node Web
Service.

The service is Docker-based so Nginx can proxy API calls:

```text
/api/*     -> backend
/oauth2/*  -> backend
```

Set this environment variable on the frontend Render service:

```text
BACKEND_URL=https://oosm-api-5im4.onrender.com
```

Do not set `BACKEND_HOSTPORT` to a Docker Compose service name such as
`oosm-backend:8084`. Docker Compose service names are not resolvable from a
separately deployed Render service.

The Docker runtime uses `BACKEND_URL` directly:

```text
BACKEND_PROXY_URL=$BACKEND_URL
```

Production Angular keeps:

```text
apiUrl=''
apiAuth=''
```

This makes the app work on whichever `.onrender.com` URL Render assigns.
