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

# Path to built files (override if your output isn't dist/*/browser/)
ARG DIST_PATH="/app/dist/*/browser/"

# Copy compiled Angular app to /osm
COPY --from=build ${DIST_PATH} /usr/share/nginx/html/

# Custom site config (serves app under /osm and handles SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck (hits the app path)
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
