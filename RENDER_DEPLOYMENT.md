# Render Deployment

Deploy this frontend through the backend Blueprint in `x-dev-grp/oosm`.

The service is Docker-based so Nginx can proxy API calls:

```text
/api/*     -> backend
/oauth2/*  -> backend
```

Render sets:

```text
BACKEND_HOSTPORT=<oosm-api private host:port>
```

The same variables are listed in `.env.render`.

The Docker runtime builds:

```text
BACKEND_PROXY_URL=http://$BACKEND_HOSTPORT
```

Production Angular keeps:

```text
apiUrl=''
apiAuth=''
```

This makes the app work on whichever `.onrender.com` URL Render assigns.
