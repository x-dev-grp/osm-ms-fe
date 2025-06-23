# syntax=docker/dockerfile:1.4
################################################################################
# 1 ─────────────── BUILD STAGE ────────────────────────────────────────────────
################################################################################
FROM node:22-alpine AS build
WORKDIR /app

# ① copy dependency manifests first → better cache reuse
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev    # or just `npm ci` if you keep devDeps

# ② copy the rest of the source and compile
COPY . .
# allow base-href / deploy-url to be overridden at build-time
RUN npm run build  --configuration=production
################################################################################
# 2 ─────────────── RUNTIME STAGE ─ NGINX 1.27 ────────────────────────────────
################################################################################
FROM nginx:1.27-alpine AS runtime
# tiny tweak: drop default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# copy built files
COPY --from=build /app/dist/ui /usr/share/nginx/html

# optional: add a basic health-check page for Render
HEALTHCHECK CMD wget -qO- http://localhost || exit 1

# Render exposes whichever port the container listens on;
# 80 is fine for Nginx but you can change it with PORT env-var if needed.
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
