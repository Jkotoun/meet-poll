# Frontend

Next.js (App Router) on Bun. See the root README for running the whole stack.

## Talking to the backend

The browser only calls `/api/*` on the frontend's own origin. The route
handler in `src/app/api/[...path]` forwards those requests to `BACKEND_URL`
(read at runtime, required at startup) with the `/api` prefix removed, and
returns a 502/504 problem when the backend is unreachable or slower than 30s.
This avoids CORS, and cookies set by the backend stay first-party.

`src/api/client.ts` creates the typed client (`openapi-fetch`): browser code
uses base URL `/api`, server code calls `backendUrl()` directly. Its types are
generated from the backend's committed `openapi.json` into
`src/api/schema.d.ts` (gitignored); Turbo regenerates them before `dev`,
`build` (and so `lint`/`typecheck`) and `test`, or run it by hand:

```bash
bun run api:generate
```

## Tests

```bash
bun run test
```
