# syntax=docker/dockerfile:1.4

##############################
# 1) BUILD STAGE (Node)
##############################
FROM node:22-alpine AS build
WORKDIR /app

# Increase memory for Angular builds
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build-time knobs (override with --build-arg)
ARG NG_CONFIG=production
ARG BASE_HREF=/osm/
ARG DEPLOY_URL=/osm/

# 1. Copy manifests first for better layer caching
COPY package.json package-lock.json* ./

# IMPORTANT: keep devDependencies for Angular CLI during build
RUN npm ci

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

# Copy compiled Angular app (Angular 15+ => dist/<project>/browser)
# If your dist layout differs, adjust the source pattern.
COPY --from=build /app/dist/*/browser/ /usr/share/nginx/html/osm/

# Custom site config (serves app under /osm and handles SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck (hits the app path)
HEALTHCHECK CMD wget -qO- http://localhost/osm/ >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
