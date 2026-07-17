# syntax=docker/dockerfile:1

################################
# 1) Base — shared setup
################################
FROM node:22-alpine AS base
WORKDIR /app
# Enable pnpm via corepack (bundled with Node 16.13+)
# Pinned to a specific version (rather than @latest) so builds stay
# reproducible and don't silently break if a newer pnpm drops support
# for the Node version in this image.
RUN corepack enable && corepack prepare pnpm@9 --activate

################################
# 2) Dependencies — install once, cached
################################
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Install ALL deps (including dev) — needed to run the Nest build step
RUN pnpm install --frozen-lockfile

################################
# 3) Build — compile TypeScript -> dist/
################################
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Prune devDependencies out, leaving only what's needed at runtime
RUN pnpm prune --prod

################################
# 4) Production runtime — small, no build tools
################################
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Run as a non-root user (security best practice for containers)
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 7004

# Basic container-level healthcheck (adjust path if you add a /health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:7004/ || exit 1

CMD ["node", "dist/main.js"]