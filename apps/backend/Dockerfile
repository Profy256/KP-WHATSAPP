# Build context must be the repo root:
#   docker build -f apps/backend/Dockerfile .

FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── Install deps ──────────────────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/backend/node_modules ./apps/backend/node_modules
COPY apps/backend/ ./apps/backend/
RUN cd apps/backend && npx prisma generate && pnpm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime binaries needed for Prisma CLI (migrations on startup)
RUN npm install -g pnpm

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder  /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder  /app/apps/backend/prisma ./apps/backend/prisma
# prisma.config.ts is required — Prisma 7 reads datasource url from it (not schema.prisma)
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
# package.json is needed so pnpm/node can resolve workspace paths
COPY apps/backend/package.json ./apps/backend/package.json

EXPOSE 3001

# Run migrations then start — safe to run migrate deploy on every boot.
# Retries handle Neon's scale-to-zero: the first attempt wakes a sleeping
# compute and may fail with P1001, so we retry until it succeeds.
CMD ["sh", "-c", "cd apps/backend && for i in 1 2 3 4 5; do npx prisma migrate deploy && break; echo \"migrate attempt $i failed, retrying in 10s\"; sleep 10; done && node dist/index.js"]
