# MemoryBridge Backend

**MemoryBridge Backend** is a secure, modular REST API built with **Node.js, Express, TypeScript (strict mode), PostgreSQL, and Prisma ORM**.

Designed specifically for individuals living with mild cognitive impairment or early-stage dementia and their family caregivers, it enforces strict dementia safety boundaries: the patient and conversational companion can **only ever access family-verified memories**. Unverified or pending memories remain quarantined in the caregiver area.

---

## 1. Quick Start

### Prerequisites
- Node.js 20+ LTS
- Windows, macOS, or Linux

### Installation
```bash
cd backend
npm install
```

### Database Setup
An embedded PostgreSQL database engine is included for instant local development without requiring external Docker setup:
```bash
# Start embedded PostgreSQL daemon (runs on localhost:5432)
npm run db:start

# Run Prisma migrations
npm run prisma:migrate

# Seed demo dataset (Rajiv Sharma, Anita, Riya, memories, routine, diary)
npm run prisma:seed
```

### Running the API Server
```bash
# Start dev server with hot reload
npm run dev
# Server starts at http://localhost:4000 (Health check: http://localhost:4000/health)
```

### Running Tests
```bash
# Run complete automated test suite (Vitest + Supertest)
npm run test
```

---

## 2. Seeded Demo Accounts

| Role | Email | Password | Access Role | Description |
|---|---|---|---|---|
| Caregiver | `anita@example.com` | `Password123!` | `OWNER` | Primary Caregiver & Wife |
| Family Member | `riya@example.com` | `Password123!` | `FAMILY` | Daughter |

---

## 3. Architecture & Security Guardrails

### 3.1 Dementia Safety Rules
1. **Verified Memories Quarantine**: The patient tablet experience and Mira companion can **only** read memories with `verificationStatus = 'VERIFIED'`.
2. **Deterministic Companion Safety**:
   - Queries regarding unverified/pending memories trigger a compassionate quarantine response without leaking unconfirmed facts:
     > *"A family member has suggested a memory about \"{title}\", but it hasn't been confirmed yet by your family. Would you like to explore one of your verified memories instead?"*
   - Queries on unknown topics reply with the exact required fallback:
     > *"I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more."*

### 3.2 Tenant Isolation & Access Control
- Every patient-specific endpoint evaluates the caller's role via `requirePatientAccess` middleware.
- Calls across tenant boundaries return **`404 Not Found`** instead of `403 Forbidden` to prevent resource enumeration.
- System administrators (`ADMIN`) cannot read patient personal memories without an explicit `PatientAccess` record.

### 3.3 Authentication & Session Revocation
- Short-lived Access Tokens (15m) + Rotating Refresh Tokens (7d) stored in `HttpOnly` SameSite cookies.
- Refresh token rotation includes **automatic reuse detection**: if a revoked refresh token is presented, the entire token family is revoked and `tokenVersion` is incremented.
- Dedicated `PatientSession` tablet tokens (`typ: "patient"`) allow zero-login patient tablet UX while enforcing backend security token scope.

### 3.4 Media Pipeline
- Pluggable `StorageProvider` abstraction (`LocalStorageProvider` with HMAC-signed URLs for local dev, `FirebaseStorageProvider` for cloud deployment).
- Strict MIME and size validations:
  - Images: `image/jpeg`, `image/png`, `image/webp` (Max 10 MB)
  - Audio: `audio/mpeg`, `audio/mp4`, `audio/wav` (Max 25 MB)
  - Video: `video/mp4`, `video/webm` (Max 200 MB)
- Private media is never served via public URLs; access requires time-limited signed read URLs.

---

## 4. API Endpoints Reference (`/api/v1`)

### Authentication (`/auth`)
- `POST /api/v1/auth/register` &rarr; Register user (`CAREGIVER` or `FAMILY_MEMBER`).
- `POST /api/v1/auth/login` &rarr; Authenticate, sets HttpOnly refresh cookie, returns access token.
- `POST /api/v1/auth/refresh` &rarr; Rotates refresh token, issues new access token.
- `POST /api/v1/auth/logout` &rarr; Revokes token family, clears cookie.
- `GET /api/v1/auth/me` &rarr; Current user profile and patient access list.

### Patient & Sessions
- `GET /api/v1/patients` &rarr; List accessible patient profiles.
- `POST /api/v1/patients` &rarr; Create new patient profile (creator granted `OWNER`).
- `GET /api/v1/patients/:patientId` &rarr; View patient profile.
- `POST /api/v1/patients/:patientId/patient-sessions` &rarr; Issue patient tablet token (`OWNER`/`CAREGIVER`).
- `GET /api/v1/patients/:patientId/patient-sessions` &rarr; List active sessions.
- `DELETE /api/v1/patient-sessions/:id` &rarr; Revoke patient session.

### Memories & Verification
- `GET /api/v1/patients/:patientId/memories` &rarr; List memories (filtered by caller role; patient token receives verified only).
- `GET /api/v1/patients/:patientId/memories/search` &rarr; Search by query, year, era, location, tags, personId.
- `POST /api/v1/patients/:patientId/memories` &rarr; Create memory (family submissions start as `PENDING`).
- `GET /api/v1/memories/:id` &rarr; Memory detail with tagged people and media.
- `PATCH /api/v1/memories/:id` &rarr; Update memory (`CAREGIVER`).
- `DELETE /api/v1/memories/:id` &rarr; Soft delete memory (`CAREGIVER`).
- `POST /api/v1/memories/:id/verify` &rarr; Verify memory and write verification audit row.
- `POST /api/v1/memories/:id/reject` &rarr; Reject memory.
- `GET /api/v1/patients/:patientId/verifications` &rarr; Verification audit trail.

### People, Relationships & Connections Graph
- `GET /api/v1/patients/:patientId/people` &rarr; Family circle with computed `sharedMemoryCount`.
- `POST /api/v1/patients/:patientId/people` &rarr; Add person to family circle.
- `PATCH /api/v1/people/:id` &rarr; Update person details.
- `DELETE /api/v1/people/:id` &rarr; Soft delete person.
- `GET /api/v1/patients/:patientId/relationships` &rarr; List family relationships.
- `POST /api/v1/patients/:patientId/relationships` &rarr; Upsert relationship.
- `GET /api/v1/patients/:patientId/graph` &rarr; Nodes and links for interactive connections graph.

### Albums & Storybooks
- `GET /api/v1/patients/:patientId/albums` & `POST /api/v1/patients/:patientId/albums` &rarr; Manage albums.
- `PUT /api/v1/albums/:id` & `DELETE /api/v1/albums/:id` &rarr; Update/delete album.
- `GET /api/v1/patients/:patientId/storybooks` & `POST /api/v1/patients/:patientId/storybooks` &rarr; Storybook CRUD.
- `POST /api/v1/storybooks/:id/memories` &rarr; Reorder storybook memories sequence.

### Routine & Diary
- `GET /api/v1/patients/:patientId/routine` & `POST /api/v1/patients/:patientId/routine` &rarr; Daily routine checklist.
- `PATCH /api/v1/routine/:id/complete` &rarr; Toggle item completion (accessible in patient tablet mode).
- `DELETE /api/v1/routine/:id` &rarr; Remove routine item.
- `GET /api/v1/patients/:patientId/diary` & `PUT /api/v1/patients/:patientId/diary` &rarr; Bedtime summary diary by date.

### Companion / Mira Safety
- `POST /api/v1/patients/:patientId/conversations/messages` &rarr; Conversational companion evaluating deterministic safety rules.

### Media & Storage
- `POST /api/v1/patients/:patientId/media/upload-url` &rarr; Generate time-limited signed upload URL.
- `POST /api/v1/patients/:patientId/media/confirm` &rarr; Confirm storage upload and insert `Media` row.
- `GET /api/v1/media/:id/url` &rarr; Generate temporary signed read URL.
- `DELETE /api/v1/media/:id` &rarr; Soft delete media record and remove storage object.

---

## 5. Verification & Test Suite

The test suite covers 100% of the critical paths:
```bash
npm run test
```
- `health.test.ts`: Health endpoints and database connectivity.
- `auth.test.ts`: User registration, login, rate limiting, refresh token rotation, token reuse detection, logout revocation, tenant access isolation.
- `core.test.ts`: Memory CRUD, role-filtered visibility, caregiver verification, people with shared memory counts, connections graph, routine toggle, bedtime diary, and complete Mira safety rules reproduction.
- `media.test.ts`: MIME allowlist, size limits, signed upload URL generation, binary upload, object verification, signed read URL generation, and cleanup.
