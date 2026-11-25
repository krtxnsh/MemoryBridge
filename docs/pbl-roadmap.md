# MemoryBridge PBL Roadmap

## Project contribution

MemoryBridge is a caregiver-governed memory recall system. Its primary contribution is not simply an AI chat interface: every personal fact must come from a family-verified memory, and every answer must be traceable to the supporting record.

## MVP acceptance criteria

- A caregiver can create a patient workspace.
- A caregiver can invite a family contributor or viewer using an expiring, one-time code.
- Family members cannot access another patient's data without membership.
- Submitted and AI-suggested memories remain hidden until verified.
- The patient can ask a question by voice or text.
- The companion searches verified memories only.
- An unknown question returns the documented safe fallback.
- Media is private and served through authorized URLs.
- Automated API and browser tests cover the principal demonstration flow.

## Delivery phases

### Phase 1 — Stable foundation (complete)

- [x] React patient and caregiver applications
- [x] Express/Prisma/PostgreSQL backend
- [x] Authentication and patient access roles
- [x] Verified-memory companion fallback
- [x] Private media pipeline
- [x] Production build and backend test suite

### Phase 2 — Family workspace access (complete)

- [x] Expiring one-time invitation codes
- [x] Family contributor and view-only roles
- [x] Secure hash storage for invite codes
- [x] Invitation creation, listing, revocation and redemption APIs
- [x] Audit events for creation, redemption and revocation
- [x] Caregiver Family Access screen
- [x] Family join-code screen
- [x] Tenant-isolation and invitation integration tests

### Phase 3 — Authentication productization

- [x] Replace automatic demo login with explicit **Try Demo** actions
- [x] Add route guards for caregiver and patient pages
- [x] Add a first-run patient/workspace setup flow
- [x] Add family-member management and role removal
- [x] Add session-expiry UI and reauthentication

### Phase 4 — Semantic verified-memory retrieval

- [ ] Replace portable PostgreSQL array storage with `pgvector` when the deployment database provides the extension
- [x] Introduce an embedding-provider interface
- [x] Generate embeddings only after a memory is verified
- [x] Search within the active patient workspace using cosine similarity
- [x] Require a configurable confidence threshold
- [x] Store the supporting memory ID and retrieval score with each answer
- [x] Add evaluation cases for paraphrases, false matches and pending-memory leakage

### Phase 4b — Provider-independent LLM grounding layer

- [x] Swap-ready `LlmProvider` interface with mock, OpenAI-compatible and Anthropic providers
- [x] Backend-only API keys via environment variables
- [x] Request timeouts (`AbortController`) with graceful fallback to the deterministic reply
- [x] Grounding guard: the LLM is never called without retrieved verified facts
- [x] Answer provenance (`answerSource`, `supportingMemoryId`) returned to the client
- [x] Tests for grounding, timeout handling and end-to-end grounded replies (mock provider)

### Phase 5 — Caregiver-reviewed AI descriptions

- [x] Add an image-description provider interface (`backend/src/services/vision/`: mock + OpenAI)
- [x] Store AI output separately from family-entered text (`Media.aiDescription` vs `caption`)
- [x] Mark generated descriptions as `AI_SUGGESTED`
- [x] Require caregiver editing or approval before patient visibility (approval promotes to caption)
- [x] Record provider, generation time and approver in the audit trail

### Phase 6 — Accessibility and end-to-end validation

- [x] Reduce the patient home screen to four primary actions (secondary actions demoted)
- [x] Add transcript confirmation before a voice question is submitted
- [x] Add reduced-motion and high-contrast preferences (toggles + persisted; browser-verified)
- [x] Add Playwright flows (caregiver demo, verified-memory load, companion recall, safe fallback, persistence, auth guard) in `e2e/`
- [x] Run Lighthouse + axe accessibility checks; fixes applied (`docs/accessibility-audit.md`)

### Phase 7 — Deployment and submission

- [ ] Deploy frontend, API, PostgreSQL and private media storage (blocked: hosting credentials)
- [ ] Configure production CORS, HTTPS and secrets (blocked: deployment)
- [x] Prepare the SRS (`docs/srs.md`), use-case / ER / architecture diagrams (`docs/design.md`)
- [x] Produce a test report and limitations section (`docs/test-report.md`)
- [x] Prepare a five-minute demonstration script (`docs/demo-script.md`)

## Demonstration flow

1. A caregiver signs in and creates a one-time family invitation.
2. A family member redeems the code and submits a memory.
3. The memory remains hidden in the patient application.
4. The caregiver verifies the memory.
5. The patient asks Mira about the event.
6. Mira retrieves the verified memory and shows its photograph.
7. The patient asks an unrelated question.
8. Mira uses the exact safe fallback instead of inventing an answer.

## Features intentionally postponed

- Facial recognition and biometric profiles
- Medical diagnosis or cognitive scoring
- Emotion detection
- Native mobile applications
- Autonomous publication of AI-generated personal information

These features add privacy, evaluation and deployment risk without strengthening the core PBL contribution.
