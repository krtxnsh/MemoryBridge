# MemoryBridge — Software Requirements Specification (SRS)

Version 1.0 · Status: implemented through Phase 6 (see `docs/pbl-roadmap.md`)

## 1. Introduction

### 1.1 Purpose
MemoryBridge is a caregiver-governed memory-recall companion for people living
with mild cognitive impairment, dementia or early-stage Alzheimer's, and the
families who care for them. Its defining contribution is **grounded recall**:
every personal fact the system presents or speaks originates from a
family-**verified** memory, and every companion answer is traceable to the
record that supports it.

### 1.2 Scope
Two coordinated experiences over one backend:
- **Caregiver / family web app** (`/family/*`) — create and curate memories,
  people, albums and storybooks; verify submissions; manage family access and
  invitations; review AI-suggested image descriptions.
- **Patient tablet app** (`/patient/*`) — a calm, low-load interface showing
  only verified content, with a conversational companion (text or voice).

### 1.3 It is explicitly **not**
A medical, diagnostic, monitoring or treatment tool. No cognitive scoring, no
emotion detection, no biometric/facial recognition. See "Postponed features" in
the roadmap.

### 1.4 Definitions
- **Verified memory** — a memory a caregiver/owner has approved
  (`verificationStatus = VERIFIED`); the only content a patient may see.
- **Grounding** — constraining any generated text to retrieved verified facts.
- **Safe fallback** — the exact sentence returned when nothing matches:
  *"I don't have that memory in your family storybook yet. Perhaps someone in
  your family can tell us more."*

## 2. Actors

| Actor | Description | Access role |
| --- | --- | --- |
| Owner | Caregiver who created the patient workspace | `OWNER` |
| Caregiver | Full management of a patient's workspace | `CAREGIVER` |
| Family contributor | Submits memories; edits only their own pending ones | `FAMILY` |
| Viewer | Read-only, verified content only | `VIEWER` |
| Patient | Uses the tablet app via a device session token | tablet session |
| System (AI) | Retrieval + optional LLM phrasing + image-description drafting | — |

## 3. Functional requirements

### FR-1 Authentication & workspace
- FR-1.1 Register, log in, and refresh with rotating JWTs (access + httpOnly refresh).
- FR-1.2 Logout invalidates tokens (token-version bump).
- FR-1.3 A caregiver can create a patient workspace (transactionally creating an
  OWNER access row and the patient's self-person record).
- FR-1.4 A patient tablet session is issued as a scoped device token.

### FR-2 Family access & invitations
- FR-2.1 Create expiring, single-use invitation codes with a role (`FAMILY`/`VIEWER`).
- FR-2.2 Invite codes are stored hashed; creation, redemption and revocation are audited.
- FR-2.3 List, revoke and redeem invitations; manage and remove workspace members.
- FR-2.4 A user may not access a patient they have no access row for.

### FR-3 Memories
- FR-3.1 Create a memory; it **always** starts `PENDING` regardless of caller.
- FR-3.2 View, edit and delete per role (FAMILY limited to own pending items).
- FR-3.3 Editing verified content reverts it to `PENDING` unless an OWNER/CAREGIVER re-verifies.
- FR-3.4 Verify / reject a memory (OWNER/CAREGIVER); verification generates its embedding.
- FR-3.5 Associate people, an album, media and tags with a memory.

### FR-4 People, albums, storybooks, routine, diary, timeline
- FR-4.1 CRUD people and relationships relative to the patient.
- FR-4.2 Create albums and associate memories.
- FR-4.3 Create storybooks (ordered collections) from memories; patients see only
  the **verified** memories within a storybook.
- FR-4.4 Routine items with periods/categories and completion state.
- FR-4.5 Daily diary entries with caregiver sign-off.

### FR-5 Media (private)
- FR-5.1 Direct upload via short-lived signed PUT URLs with a server-side intent.
- FR-5.2 Validate type/size and magic bytes; enforce per-patient quota and per-memory caps.
- FR-5.3 Serve private media only through authorized, time-limited read URLs.
- FR-5.4 Update captions, delete media, and clean up expired intents.
- FR-5.5 Attaching/mutating media on a verified memory re-gates it to `PENDING`.

### FR-6 AI companion (grounded)
- FR-6.1 Retrieve only `VERIFIED` memories for the active patient (semantic similarity + coverage threshold).
- FR-6.2 Never retrieve or embed a pending/unverified memory.
- FR-6.3 Answer from retrieved verified facts; return the exact safe fallback when nothing matches.
- FR-6.4 Optional provider-independent LLM layer rephrases **only** retrieved facts; it is
  never called when there are zero facts, so it cannot invent history.
- FR-6.5 Each answer reports provenance: `answerSource` (`llm`/`rule_based`/`fallback`) and `supportingMemoryId`.
- FR-6.6 Persist conversation turns with the supporting memory id and retrieval score.

### FR-7 Caregiver-reviewed AI image descriptions
- FR-7.1 Generate a draft description for a photo (provider-independent), stored
  separately from the family caption as `AI_SUGGESTED`.
- FR-7.2 An unapproved AI description is never visible to a patient.
- FR-7.3 A caregiver edits/approves (promoting it to the patient-visible caption) or rejects; provider, time and approver are audited.

### FR-8 Voice & accessibility
- FR-8.1 Browser speech-to-text with graceful degradation and specific error guidance.
- FR-8.2 A voice transcript is confirmed by the patient before it is submitted.
- FR-8.3 Text-to-speech read-aloud for companion answers and stories.
- FR-8.4 Text-size, high-contrast and reduced-motion preferences.
- FR-8.5 Patient home presents four primary actions; secondary actions are demoted.

## 4. Non-functional requirements

- **NFR-1 Privacy/isolation**: tenant isolation by access row; unauthorized
  resources return `404` (not `403`) to prevent enumeration; media is never public.
- **NFR-2 Safety**: the AI never presents generated assumptions as personal
  memories; verification rules are enforced server-side and cannot be overridden by the client.
- **NFR-3 Security**: hashed passwords and invite codes; rotating refresh tokens;
  input validation (Zod) on every endpoint; rate limiting on sensitive routes.
- **NFR-4 Accessibility**: ≥56px touch targets on patient screens, WCAG-minded
  contrast, reduced-motion support, no autoplay audio, no time pressure.
- **NFR-5 Reliability/honesty (frontend)**: the backend is the source of truth
  for a signed-in workspace; failed writes roll back and surface an error — the UI
  never shows success on failure and never masks a backend failure with demo data.
- **NFR-6 Portability**: provider-independent LLM, embedding, image-description and
  storage layers selected by environment variables; keys stay on the backend.

## 5. External interfaces & constraints
- REST API under `/api/v1`, `{ data, error }` response envelope.
- PostgreSQL via Prisma; portable array-based embeddings (pgvector-ready).
- Pluggable storage (`local` | `firebase` | `mock`); LLM (`none` | `mock` |
  `openai` | `anthropic`); image description (`none` | `mock` | `openai`).

## 6. Design artifacts
- System architecture, ER diagram, and use-case diagram: `docs/design.md`.
- Verification results and limitations: `docs/test-report.md`.
