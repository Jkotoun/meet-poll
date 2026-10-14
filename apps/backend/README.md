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

## Database migrations

Migrations are generated from entity metadata, reviewed, and committed.
Commands read `DATABASE_URL` from `.env`.

```bash
bun run migration:create --name <name>  # diff entities → new migration
bun run migration:up                    # apply pending migrations
bun run migration:down                  # revert the last one
```
