# Render Deployment

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
BACKEND_URL=https://oosm-api.onrender.com
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
