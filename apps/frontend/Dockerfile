# Build context must be the repo root:
#   docker build -f apps/frontend/Dockerfile .
#
# Pass the backend URL at build time:
#   docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api \
#                -f apps/frontend/Dockerfile .

FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── Install deps ──────────────────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY apps/frontend/ ./apps/frontend/

# NEXT_PUBLIC_ vars must be present at build time — they are baked into the bundle
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app/apps/frontend
RUN pnpm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app/apps/frontend
ENV NODE_ENV=production

COPY --from=installer /app/node_modules /app/node_modules
COPY --from=installer /app/apps/frontend/node_modules ./node_modules
COPY --from=builder  /app/apps/frontend/.next ./.next
COPY --from=builder  /app/apps/frontend/public ./public
COPY --from=builder  /app/apps/frontend/package.json ./package.json
COPY --from=builder  /app/apps/frontend/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
