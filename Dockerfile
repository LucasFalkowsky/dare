# syntax=docker/dockerfile:1

# ---- dependencies: installed once, shared by both builds --------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: backend (tsc) and frontend (vite) in one pass -------------------
FROM deps AS build
WORKDIR /app
COPY tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
# prisma.config.ts resolves DATABASE_URL through env(), which throws when unset.
# `generate` never opens a connection, so a placeholder suffices at build time.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate
RUN npm run build:backend
RUN npm run build:frontend

# ---- runtime dependencies: no devDependencies in the final image ------------
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime ----------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/frontend/dist ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || exit 1
# Migrations and the (idempotent) principle seed run on every start, so a
# deployment needs no manual step after Coolify swaps the container.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/seed.js && node dist/index.js"]
