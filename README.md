# Meet Poll

A Doodle-style scheduling-poll app: an organizer proposes candidate meeting
times, invitees vote **Yes / No / If-need-be** on each one, and the app
surfaces the slot where the most people can attend.

## Tech stack

**Frontend** — `apps/frontend`
- [Next.js](https://nextjs.org/) (App Router)
- [MUI](https://mui.com/) v9 + [Tailwind CSS](https://tailwindcss.com/) v4, combined via CSS cascade layers

**Backend** — `apps/backend`
- [NestJS](https://nestjs.com/)
- PostgreSQL via MikroORM, behind a repository/ports-and-adapters layer *(planned)*

**Shared tooling**
- [Bun](https://bun.sh/) as the JS runtime for both apps
- [pnpm](https://pnpm.io/) workspaces + [Turborepo](https://turborepo.com/) for the monorepo
- [oxlint](https://oxc.rs/) + [oxfmt](https://oxc.rs/) for linting/formatting
- `bun test` for the backend test suite

**Infra & deployment** *(planned)*
- [Terraform](https://www.terraform.io/) on Google Cloud (Cloud Run, Secret Manager, IAM)
- GitHub Actions CI/CD — checks on PRs into `develop`, deploy from `main`
- Docker Compose for local Postgres

## Running locally

Requires [Bun](https://bun.sh/) and [pnpm](https://pnpm.io/) installed.

```bash
pnpm install

# backend — http://localhost:3000
pnpm --filter backend run start:dev

# frontend — also defaults to :3000, run on another port if both are up:
pnpm --filter frontend run dev -- -p 3001
```

There's no database wired up yet, so the backend currently runs without any
external dependency. A `docker-compose.yml` for local Postgres will be added
once the persistence layer lands.
