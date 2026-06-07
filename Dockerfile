# syntax=docker/dockerfile:1.4

##############################
# 1) BUILD STAGE (Node)
##############################
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
# Pass Angular flags after "--"
RUN npm run build -- -c=${NG_CONFIG} --base-href=${BASE_HREF} --deploy-url=${DEPLOY_URL}

##############################
# 2) RUNTIME STAGE (Nginx)
##############################
FROM nginx:1.27-alpine AS runtime

# Remove default welcome page
RUN rm -rf /usr/share/nginx/html/*

# Path to built files.
ARG DIST_PATH="/app/dist/ui/"

# Copy compiled Angular app.
COPY --from=build ${DIST_PATH} /usr/share/nginx/html/

# Render and Railway provide PORT at runtime.
ENV PORT=8080
ENV BACKEND_URL=
ENV BACKEND_HOSTPORT=
COPY nginx.conf.template /etc/nginx/default.conf.template

# Healthcheck (hits the app path)
HEALTHCHECK CMD wget -qO- "http://localhost:${PORT}/" >/dev/null 2>&1 || exit 1

EXPOSE 8080
CMD ["sh", "-c", "export BACKEND_PROXY_URL=\"${BACKEND_URL:-http://${BACKEND_HOSTPORT:-localhost:8084}}\"; envsubst '${PORT} ${BACKEND_PROXY_URL}' < /etc/nginx/default.conf.template > /etc/nginx/conf.d/default.conf; nginx -g 'daemon off;'"]
