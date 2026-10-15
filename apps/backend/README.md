# Backend

NestJS API, run with Bun. See the root README for running the whole stack.

## Layout

Each feature module is split into layers; shared ORM setup lives in
`src/database/`.

```
src/
  config/              # validated env (fails fast at boot)
  database/            # MikroORM options, Nest module, migrations
  <feature>/
    domain/            # plain classes + repository ports (no ORM imports)
    application/       # services, depend only on ports
    infrastructure/
      persistence/     # defineEntity mappings + MikroORM port adapters
    <feature>.module.ts
```

## API contract

Routes are versioned under `/v1` (`/health` is unversioned). Outside
production, Swagger UI is served at `/docs`.

`openapi.json` is the committed contract the frontend client is generated
from. Regenerate it after changing routes or DTOs; CI fails when it's stale.

```bash
bun run openapi:generate
```

DTO schemas come from explicit `@ApiProperty()` decorators. The swagger CLI
plugin isn't used because Bun runs `src` without tsc transformers.

## Errors and validation

Every error is an RFC 9457 `application/problem+json` body. Request input
(body, query, params) is validated against class-validator DTOs; unknown
properties are rejected, and invalid fields are listed in `errors[]` as JSON
pointers.

## Database migrations

Migrations are generated from entity metadata, reviewed, and committed. The
app applies pending ones on startup, before the new revision serves traffic,
so the migrated schema must still work with the previous release's code
(expand/contract). The commands below read `DATABASE_URL`
from `.env`.

```bash
bun run migration:create --name <name>  # diff entities → new migration
bun run migration:up                    # apply pending migrations
bun run migration:down                  # revert the last one
```

## Tests

```bash
bun run test      # unit tests
bun run test:e2e  # e2e tests against the compose Postgres
```

Each e2e test file creates its own database (`meetpoll_test_<uuid>`) on the
server from `DATABASE_URL` (`.env.test`) and drops it when the file finishes,
so files run in parallel without sharing state. With a non-default port, run
e.g. `DATABASE_URL=postgresql://meetpoll:meetpoll@localhost:5433/meetpoll bun run test:e2e`.
