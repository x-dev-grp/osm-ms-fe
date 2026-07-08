FROM node:20-alpine AS build
WORKDIR /app

# Increase memory for Angular builds
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build-time knobs (override with --build-arg)
ARG NG_CONFIG=production
ARG BASE_HREF=/
ARG DEPLOY_URL=/
# npm install flags (default to --force to bypass peer-dep conflicts)
ARG NPM_CI_FLAGS="--force"
# (optional) npm token for private packages
ARG NPM_TOKEN

# 1. Copy manifests first for better layer caching
COPY package.json package-lock.json* ./

# If a token is provided, write it for this build only
RUN test -z "$NPM_TOKEN" || echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Install deps (same behavior as CI)
RUN npm ci $NPM_CI_FLAGS

# 2. Copy source and build
COPY . .
RUN V=$(tr -d '\r\n' < VERSION) && P=$(node -p "require('./package.json').version") && \
    test "$V" = "$P" || (echo "VERSION ($V) != package.json ($P)" && exit 1)
# Pass Angular flags after "--"
RUN npm run build -- -c=${NG_CONFIG} --base-href=${BASE_HREF} --deploy-url=${DEPLOY_URL}

##############################
# 2) RUNTIME STAGE (Nginx)
##############################
FROM nginx:1.27-alpine AS runtime

ARG APP_VERSION=unknown
LABEL org.opencontainers.image.version="${APP_VERSION}"

# Remove default welcome page
RUN rm -rf /usr/share/nginx/html/*

# Path to built files.
ARG DIST_PATH="/app/dist/ui/"

# Copy compiled Angular app.
COPY --from=build ${DIST_PATH} /usr/share/nginx/html/

# Render and Railway provide PORT at runtime.
ENV PORT=8080
ENV BACKEND_URL=https://oosm-api-5im4.onrender.com
ENV BACKEND_HOSTPORT=
COPY nginx.conf.template /etc/nginx/default.conf.template

# Healthcheck (lightweight nginx endpoint; full stack via /actuator/health on backend)
HEALTHCHECK CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT:-8080}/health" >/dev/null 2>&1 || exit 1'

EXPOSE 8080
CMD ["sh", "-c", "if [ -n \"$BACKEND_URL\" ]; then export BACKEND_PROXY_URL=\"$BACKEND_URL\"; elif [ -n \"$BACKEND_HOSTPORT\" ]; then export BACKEND_PROXY_URL=\"http://${BACKEND_HOSTPORT}\"; else echo 'BACKEND_URL or BACKEND_HOSTPORT is required' >&2; exit 1; fi; envsubst '${PORT} ${BACKEND_PROXY_URL}' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf; nginx -t && exec nginx -g 'daemon off;'"]
