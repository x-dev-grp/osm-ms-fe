# Render Deployment

## Hybrid: Render frontend + Railway backend + Render Postgres

Keep **oosm-web** on Render and point nginx at the Railway API:

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
