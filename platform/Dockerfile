# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS builder
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG http_proxy
ARG https_proxy
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=build_ca,target=/tmp/build-ca.pem if [ -f /tmp/build-ca.pem ]; then npm ci --cache /tmp/npm-cache --cafile=/tmp/build-ca.pem; else npm ci --cache /tmp/npm-cache; fi
COPY . ./
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG http_proxy
ARG https_proxy
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-noto-cjk ca-certificates tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 CHROMIUM_PATH=/usr/bin/chromium LOCAL_DB_PATH=/app/data/operations.sqlite PRIVATE_STORAGE_PATH=/app/data/private
COPY --from=builder --chown=node:node /app/.next/standalone/ ./
COPY --from=builder --chown=node:node /app/scripts/provision-runtime.mjs ./provision-runtime.mjs
COPY --from=builder --chown=node:node /app/supabase/migrations/ ./migrations/
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
