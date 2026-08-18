# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compiles the checklist schema (fails the build on an invalid form definition),
# then builds the Next.js standalone bundle.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Needed at runtime by `npm run db:migrate` / `db:sync-schema`.
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/checklists ./checklists
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/lib/checklist ./src/lib/checklist
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/var/uploads && chown -R nextjs:nodejs /app/var
VOLUME /app/var/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
