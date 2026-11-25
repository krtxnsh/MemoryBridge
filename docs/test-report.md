# MemoryBridge — Test Report & Limitations

All results below were produced by running the suites against a real PostgreSQL
database and a real Chromium browser. Nothing here is asserted from code
inspection alone.

## 1. Environment
- Node 22, PostgreSQL 16, Prisma (4 migrations applied).
- Backend: Vitest + Supertest against the live Express app and database.
- Frontend: `tsc` type-check + Vite production build; `oxlint`.
- E2E: Playwright (Chromium) against DB + API + Vite dev server, LLM in `mock` mode.

## 2. Automated backend tests — 143 / 143 passing (9 suites)

| Suite | Tests | Area |
| --- | ---: | --- |
| `auth.test.ts` | 14 | Registration, login, refresh rotation, logout invalidation, tenant isolation |
| `core-steps1-4.test.ts` | 34 | Patients, memories, people, albums, access matrix |
| `core-steps6-9.test.ts` | 29 | Storybooks, verification, routine, diary, dashboard, companion |
| `invitation.test.ts` | 10 | Expiring one-time invite codes, redemption, revocation, isolation |
| `media-storage.test.ts` | 33 | Signed upload/confirm, magic-byte validation, quotas, read URLs, cleanup |
| `media-ai-description.test.ts` | 10 | Provider factory, draft generation, patient non-exposure, approve/reject gate |
| `companion-llm.test.ts` | 8 | Grounding guard, timeout handling, end-to-end grounded reply + fallback |
| `embedding.test.ts` | 3 | Semantic similarity / coverage |
| `health.test.ts` | 2 | Health endpoint |
| **Total** | **143** | |

Run with `cd backend && npm test` (requires a reachable PostgreSQL).

## 3. End-to-end browser test — 8 / 8 passing

`npm run test:e2e` (`e2e/companion-flow.cjs`) drives a real browser through the
principal demonstration flow:

1. Landing page renders. ✅
2. Caregiver demo sign-in reaches `/family`. ✅
3. All workspace data loads from the backend — no data-load error toast. ✅
4. A seeded **verified** memory ("Red Bicycle") appears in the library. ✅
5. The companion **recalls that verified memory** with a grounded answer. ✅
6. An unknown question returns the **exact safe fallback**. ✅
7. Session and memories **persist across a reload**. ✅
8. A signed-out visitor is **redirected away** from caregiver pages. ✅

## 4. Front-end checks
- `npm run build` (type-check + production build): **PASS**.
- `npm run lint` (oxlint): **0 errors** (unused-import warnings only).

## 5. Manual / scripted API validation (live stack)
The complete critical scenario was also exercised directly over HTTP against the
running API and verified:
- memory created as `PENDING`; media uploaded via signed URL → PUT → confirm;
  caregiver verify → `VERIFIED`;
- patient tablet session sees **only** verified memories; companion cites the
  correct `supportingMemoryId`; unknown question → safe fallback (LLM not invoked);
- data persists on refetch; a different caregiver and an unauthenticated request
  receive `404` / `401` for another patient's memories, media and companion.
- Storybooks: a caregiver adding a pending memory to a storybook still yields a
  patient view containing **only** the verified memories in it.

## 6. Defects found and fixed during this work
- **Silent mock-data masking (frontend)**: list calls for albums and routine
  expected a bare array but the API returns `{ items, page, total }`, so `.map`
  threw and the app silently displayed seed/mock data instead of real backend
  data. Diary read the list envelope instead of an entry. Fixed by normalizing
  the paginated shape; the E2E now guards against a silent data-load error.
- **False success / no rollback (frontend)**: mutations showed success even when
  the backend write failed and never rolled back. Now every mutation rolls back
  the optimistic change and surfaces an error on failure.
- **Fake local verification**: the storybook wizard marked memories `verified`
  locally though the backend always creates them `PENDING`. Verification now goes
  through the real endpoint.
- **Upload false success**: the wizard reported "upload completed" even when
  uploads failed; it now reports per-file outcomes accurately.

## 7. Limitations & items requiring external credentials

| Item | Status | Reason |
| --- | --- | --- |
| Real OpenAI / Anthropic LLM calls | BLOCKED | Needs `LLM_API_KEY`; structure, timeouts and errors are implemented and tested with the `mock` provider |
| Real OpenAI vision image descriptions | BLOCKED | Needs `IMAGE_DESCRIPTION_API_KEY`; tested with the `mock` provider |
| Firebase private media storage | BLOCKED | Needs Firebase credentials; validated with the `local` provider |
| Lighthouse accessibility audit | PENDING | Not yet run |
| `pgvector` retrieval | PENDING (by design) | Deferred until the deployment DB offers the extension; portable array cosine retrieval is used today |
| Production deployment (hosting, CORS, HTTPS, secrets) | BLOCKED | No hosting credentials in this environment |

## 8. How to reproduce
```bash
# Backend tests (needs PostgreSQL + backend/.env)
cd backend && npx prisma migrate deploy && npm test

# Front-end checks
npm run lint && npm run build

# End-to-end browser flow (boots DB/API/web, seeds demo, runs Chromium)
npm run test:e2e
```
