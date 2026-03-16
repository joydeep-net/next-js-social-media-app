FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public* ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy OTel packages needed by instrumentation hook
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@opentelemetry ./node_modules/@opentelemetry
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/import-in-the-middle ./node_modules/import-in-the-middle
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/require-in-the-middle ./node_modules/require-in-the-middle
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/shimmer ./node_modules/shimmer
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/semver ./node_modules/semver
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
