# Backend

NestJS API, run with Bun. See the root README for running the whole stack.

## Layout

Plain NestJS feature modules, as in the Nest docs: each feature folder holds
its module, controller, service, DTOs (`dto/`) and MikroORM entities
(`entities/`, decorated classes). Services use the `EntityManager`
directly. Shared ORM setup lives in `src/database/`.

```
src/
  config/        # validated env (fails fast at boot)
  database/      # MikroORM options, Nest module, migrations
  http-errors/   # problem+json filter, ProblemException, validation pipe
  users/         # User + Identity entities, UsersService
  auth/          # register/login/logout/me, session cookie, SessionGuard
  events/        # Event, TimeSlot and Vote entities; events, voting, ranking, finalize
  common/        # small shared helpers (DTO transforms)
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

Expected failures are thrown as `ProblemException` with a `ProblemType`
(status, code, title); clients get `type: /problems/<code>` to branch on, and
`@ApiProblemResponse(...)` documents them in the spec.

## Auth

`POST /v1/auth/register` and `/login` set a 7-day HS256 JWT in an httpOnly, `SameSite=Lax` `session` cookie (Secure in
production); `/logout` clears it. `SessionGuard` protects routes (import
`AuthModule`, then use `@UseGuards(SessionGuard)` and `@CurrentUser()`); it
loads the user on every request, so deleted accounts lose access at once.
Wrong passwords and unknown emails get the same 401 and take the same time.
Only JSON bodies are parsed, so HTML forms on other sites can't submit
credentials.

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
bun run migration:check                 # fail if entities need a new migration (CI)
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
