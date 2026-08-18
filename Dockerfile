# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compiles and validates the checklist definitions (a bad form definition fails the
# build here, not in production), then builds the standalone Next.js bundle.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Read at startup by the bootstrap step: migrations to apply, and the compiled
# checklists to publish. See src/lib/bootstrap.ts.
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/generated ./generated

RUN mkdir -p /app/var/uploads && chown -R nextjs:nodejs /app/var
VOLUME /app/var/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
