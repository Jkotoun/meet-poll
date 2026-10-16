# Frontend

Next.js (App Router) on Bun. See the root README for running the whole stack.

## Talking to the backend

The browser only calls `/api/*` on the frontend's own origin. `src/proxy.ts`
rewrites those requests to `BACKEND_URL` (read at runtime, required at
startup) with the `/api` prefix removed; Next forwards them and gives up after
30s. This avoids CORS, and cookies set by the backend stay first-party.

`src/api/client.ts` creates the typed client (`openapi-fetch`): browser code
uses base URL `/api`, server code calls `backendUrl()` directly. Its types are
generated from the backend's committed `openapi.json` into
`src/api/schema.d.ts` (gitignored); Turbo regenerates them before `dev`,
`build` (and so `lint`/`typecheck`) and `test`, or run it by hand:

```bash
bun run api:generate
```

## Auth

`/login` and `/register` use TanStack Form (shared pieces in `src/forms/form.tsx`). The backend
validates on submit, and its problem details become field errors (`errors[]`
pointers) or a form-level alert; `?next=` redirects only to same-origin paths.

TanStack Query holds the session user; the login, register and logout
mutations update it. `CurrentUserBoundary` reads it on the server
(`getCurrentUser()` calls `/v1/auth/me` with the cookie) and hydrates it, so
the nav is right in the server HTML. If the backend is unreachable, public
pages still render and the browser fetches the user later. Protected pages
(`/account`, `/events/**`) call `requireUser()` on the server, which redirects
to `/login?next=…`.

## Events

Pages under `/events` are server components that call the backend directly
with the visitor's cookies (`serverApi()`); forms post through the `/api`
proxy and navigate on success. Slot times are entered in the browser's time
zone, which becomes the event's, and shown grouped by day in that zone with
a fixed locale, so server and browser render the same text.

## Tests

```bash
bun run test           # unit tests
bun run test:browser   # Playwright against the full stack (needs Postgres)
```

The browser tests start the backend (port 3101) and the built frontend (port 3100) themselves, using each app's `.env`/`.env.local`.
