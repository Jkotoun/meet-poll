# Meet Poll - WIP

A Doodle-style scheduling-poll app: an organizer proposes candidate meeting
times, invitees vote **Yes / No / If-need-be** on each one, and the app
surfaces the slot where the most people can attend.

## Tech stack

**Frontend** — `apps/frontend`

- [Next.js](https://nextjs.org/) (App Router)
- [MUI](https://mui.com/) v9 + [Tailwind CSS](https://tailwindcss.com/) v4, combined via CSS cascade layers

**Backend** — `apps/backend`

- [NestJS](https://nestjs.com/)
- PostgreSQL via MikroORM, behind a repository/ports-and-adapters layer

**Shared tooling**

- [Bun](https://bun.sh/) as the runtime and package manager for both apps
- Bun workspaces + [Turborepo](https://turborepo.com/) for the monorepo
- [oxlint](https://oxc.rs/) + [oxfmt](https://oxc.rs/) for linting/formatting
- `bun test` for the backend test suite
- Docker Compose for local Postgres

**Infra & deployment** _(planned)_

- [Terraform](https://www.terraform.io/) on Google Cloud (Cloud Run, Secret Manager, IAM)
- GitHub Actions CI/CD — checks on PRs into `develop`, deploy from `main`

## Running locally

Requires [Bun](https://bun.sh/) and Docker.

```bash
bun install
cp apps/backend/.env.example apps/backend/.env

# Postgres — localhost:5432 (user/password/db: meetpoll)
docker compose up -d --wait
bun run --filter backend migration:up

# backend — http://localhost:3001
bun run dev:be

# frontend — http://localhost:3000
bun run dev:fe
```

If port 5432 is taken, pick another host port with
`POSTGRES_PORT=5433 docker compose up -d --wait`. `docker compose down -v`
stops Postgres and wipes its data.
