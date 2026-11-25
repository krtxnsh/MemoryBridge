# End-to-end browser tests

A real-browser (Playwright/Chromium) run of the principal MemoryBridge
demonstration flow against the **actual** stack — PostgreSQL, the Express API,
and the Vite dev server with its `/api` proxy.

## What it covers

1. Landing page renders.
2. Caregiver demo sign-in (hits the real `/auth/demo`).
3. **Every workspace resource loads from the backend** — no silent mock fallback
   and no "could not be loaded" error toast (regression guard).
4. A seeded **verified** memory appears in the caregiver library.
5. The companion **recalls that verified memory** with a grounded answer.
6. An unknown question returns the **exact safe fallback** (no invention).
7. Session and data **persist across a reload**.
8. A signed-out visitor is **redirected away** from caregiver pages.

## Run it

```bash
npm run test:e2e
```

`e2e/run-e2e.sh` will:
- ensure PostgreSQL is reachable (and start a local cluster if one is configured),
- apply migrations and seed the demo workspace (idempotent — skipped if present),
- start the API (`LLM_PROVIDER=mock`) and the Vite dev server,
- run `e2e/companion-flow.cjs`, then tear the servers down.

Screenshots are written to `e2e/artifacts/` (git-ignored). Exit code is non-zero
if any check fails.

## Notes

- Uses the pre-installed Playwright Chromium (`require('playwright')`,
  `chromium.launch()` needs no options). In a fresh environment run
  `npx playwright install chromium` once.
- Override endpoints with `API_PORT`, `WEB_PORT`, or `E2E_BASE_URL`.
