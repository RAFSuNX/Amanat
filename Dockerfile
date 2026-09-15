FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# --no-audit --no-fund avoid extra registry round-trips that frequently hang
# under arm64 QEMU emulation.
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* must be present at build time - they are compiled into the client
# bundle. Passed in from CI (build-arg) sourced from a GitHub secret. Empty is
# fine: the client falls back to window.location.origin.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Migration image: standalone runner strips drizzle-kit (a devDependency) and the
# db/ folder, so migrations run from this dedicated image instead. It reuses the
# deps node_modules (which includes drizzle-kit) plus the configs + migration SQL.
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY drizzle.config.ts drizzle.audit.config.ts ./
COPY db ./db
COPY scripts/preflight.mjs ./scripts/preflight.mjs
# Preflight checks the DBs are reachable, then applies both migration sets.
CMD ["sh", "-c", "node scripts/preflight.mjs && npm run db:migrate && npm run db:audit:migrate"]

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
