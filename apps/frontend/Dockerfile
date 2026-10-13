# Build context is the repo root: docker build -f apps/frontend/Dockerfile .
# CI passes BUN_VERSION from package.json's packageManager; the default is
# only for local builds.
ARG BUN_VERSION=1.4.2

FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

# turbo prune isolates the frontend workspace with a pruned lockfile, so
# backend-only dependency changes don't invalidate the install layer below.
FROM base AS prune
COPY . .
RUN bun install --frozen-lockfile --filter meet-poll
RUN bunx turbo prune frontend --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bunx turbo run build --filter=frontend

# The standalone output already contains the traced production dependencies,
# so the runtime stage needs no install step.
FROM base AS runtime
ENV PORT=8080
# server.js binds to $HOSTNAME, which Docker sets to the container id.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
# Next writes its ISR and image caches under .next/; only that directory is
# writable by the runtime user, server.js and node_modules stay root-owned.
RUN chown -R bun:bun apps/frontend/.next
USER bun
EXPOSE 8080
CMD ["bun", "apps/frontend/server.js"]
