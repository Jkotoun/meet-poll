# Build from the repo root: docker build -f apps/backend/Dockerfile .
# Keep the Bun version in sync with packageManager in package.json.
FROM oven/bun:1.4.2-slim AS base
WORKDIR /app

# Prune to the backend workspace so frontend dep changes don't bust the cache.
FROM base AS prune
COPY . .
RUN bun install --frozen-lockfile --filter meet-poll
RUN bunx turbo prune backend --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN bunx turbo run build --filter=backend

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile --production && rm -rf ~/.bun/install/cache
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
WORKDIR /app/apps/backend
USER bun
EXPOSE 8080
CMD ["bun", "dist/main.js"]
