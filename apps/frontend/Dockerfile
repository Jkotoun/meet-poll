# Build from the repo root: docker build -f apps/frontend/Dockerfile .
# Keep the Bun version in sync with packageManager in package.json.
FROM oven/bun:1.4.2-slim AS base
WORKDIR /app

# Prune to the frontend workspace so backend dep changes don't bust the cache.
FROM base AS prune
COPY . .
RUN bun install --frozen-lockfile --filter meet-poll
RUN bunx turbo prune frontend --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
# The API types are generated from the backend's committed spec, which the prune leaves out.
COPY --from=prune /app/apps/backend/openapi.json ./apps/backend/openapi.json
ENV NEXT_TELEMETRY_DISABLED=1
RUN bunx turbo run build --filter=frontend

# Standalone output already bundles its prod deps.
FROM base AS runtime
ENV PORT=8080
# server.js binds to $HOSTNAME, which Docker sets to the container id.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
# Only .next/ (Next's runtime caches) is writable by the app user.
RUN chown -R bun:bun apps/frontend/.next
USER bun
EXPOSE 8080
CMD ["bun", "apps/frontend/server.js"]
