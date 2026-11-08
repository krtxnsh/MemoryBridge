# MemoryBridge API Documentation

MemoryBridge backend adheres strictly to the `{ data, error }` response envelope across all endpoints.

```json
// Success
{
  "data": { ... },
  "error": null
}

// Error
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication (`/api/v1/auth`)

- `POST /api/v1/auth/register` — Register a new account (`name`, `email`, `password`, `role`).
- `POST /api/v1/auth/login` — Login with credentials (`email`, `password`), returns tokens.
- `POST /api/v1/auth/refresh` — Refresh access token using refresh cookie or body token.
- `POST /api/v1/auth/logout` — Invalidate refresh token and clear cookie.
- `GET /api/v1/auth/me` — Return current authenticated user profile.

---

## 2. Patients & Tablet Sessions (`/api/v1/patients`)

- `GET /api/v1/patients` — List patients accessible to current user.
- `POST /api/v1/patients` — Create patient profile transactionally with OWNER access and self-person record.
- `GET /api/v1/patients/:id` — Get patient profile and caller's access role.
- `PATCH /api/v1/patients/:id` — Update patient profile (`OWNER`, `CAREGIVER`).
- `DELETE /api/v1/patients/:id` — Soft-delete patient profile (`OWNER` only).
- `POST /api/v1/patients/:patientId/patient-sessions` — Issue time-limited patient tablet token (`CAREGIVER`, `OWNER`).
- `GET /api/v1/patients/:patientId/patient-sessions` — List active sessions.
- `DELETE /api/v1/patient-sessions/:id` — Revoke session.

---

## 3. Memories (`/api/v1/memories` & `/api/v1/patients/:patientId/memories`)

- `GET /api/v1/patients/:patientId/memories` — List memories (paginated, role-filtered).
- `GET /api/v1/patients/:patientId/memories/search` — Search memories with query filters (`q`, `year`, `era`, `location`, `eventType`, `personId`).
- `POST /api/v1/patients/:patientId/memories` — Create memory (`PENDING` verification status).
- `GET /api/v1/memories/:id` — Get memory details by UUID.
- `PATCH /api/v1/memories/:id` — Update memory. If `VERIFIED`, auto-reverts to `PENDING` unless `reverify: true` is passed by `OWNER`/`CAREGIVER`.
- `DELETE /api/v1/memories/:id` — Soft-delete memory.

---

## 4. Verification (`/api/v1/memories/:id/verify`, `/reject`)

- `POST /api/v1/memories/:id/verify` — Approve memory (`VERIFIED`) (`OWNER`, `CAREGIVER`).
- `POST /api/v1/memories/:id/reject` — Reject memory (`REJECTED`) (`OWNER`, `CAREGIVER`).
- `GET /api/v1/patients/:patientId/verifications/pending` — List pending memories awaiting review.
- `GET /api/v1/patients/:patientId/verifications/audit` — Complete verification audit trail.

---

## 5. People & Relationships (`/api/v1/people`, `/api/v1/relationships`)

- `GET /api/v1/patients/:patientId/people` — List known people (tablet callers only see `confirmedByFamily = true`).
- `POST /api/v1/patients/:patientId/people` — Add person record.
- `GET /api/v1/people/:id` — Get person details with relationship label relative to patient self-person.
- `PATCH /api/v1/people/:id` — Update person.
- `DELETE /api/v1/people/:id` — Soft delete person.
- `POST /api/v1/relationships` — Create relationship link between two people belonging to the same patient.
- `DELETE /api/v1/relationships/:id` — Remove relationship link.

---

## 6. Albums (`/api/v1/albums`)

- `GET /api/v1/patients/:patientId/albums` — List albums with derived memory counts.
- `POST /api/v1/patients/:patientId/albums` — Create album.
- `GET /api/v1/albums/:id` — Get album details with associated memories.
- `PATCH /api/v1/albums/:id` — Update album.
- `DELETE /api/v1/albums/:id` — Delete album (disassociates memories without deleting them).

---

## 7. Storybooks (`/api/v1/storybooks`)

- `GET /api/v1/patients/:patientId/storybooks` — List storybooks (paginated).
- `POST /api/v1/patients/:patientId/storybooks` — Create storybook with ordered memories.
- `GET /api/v1/storybooks/:id` — Get storybook details with ordered chapters.
- `PATCH /api/v1/storybooks/:id` — Update storybook metadata/status.
- `DELETE /api/v1/storybooks/:id` — Soft delete storybook.
- `POST /api/v1/storybooks/:id/memories` — Add memory to storybook.
- `DELETE /api/v1/storybooks/:id/memories/:memoryId` — Remove memory from storybook.

---

## 8. Routine, Diary, Dashboard & Companion

- `GET /api/v1/patients/:patientId/routine` — Get patient routine items.
- `POST /api/v1/patients/:patientId/routine` — Add routine item.
- `PATCH /api/v1/routine/:id` — Update routine item.
- `POST /api/v1/routine/:id/toggle` — Toggle routine completion for date (`tablet` permitted).
- `DELETE /api/v1/routine/:id` — Delete routine item.
- `GET /api/v1/patients/:patientId/diary` — Get daily diary recaps.
- `POST /api/v1/patients/:patientId/diary` — Create or upsert daily diary recap.
- `GET /api/v1/patients/:patientId/dashboard` — Aggregated dashboard statistics (role-filtered).
- `GET /api/v1/patients/:patientId/graph` — Knowledge graph of people and memory co-occurrences.
- `POST /api/v1/patients/:patientId/companion/message` — Safe companion interaction (`tablet` permitted).

---

## 9. Media & Private Storage (`/api/v1/media` & `/api/v1/patients/:patientId/media`)

- `POST /api/v1/patients/:patientId/media/upload-url` — Request short-lived V4 signed PUT URL for direct storage upload.
- `POST /api/v1/patients/:patientId/media/confirm` — Validate uploaded storage object (size & magic bytes), bind to target, and create Media row.
- `GET /api/v1/patients/:patientId/media` — List media items (paginated, role-filtered).
- `GET /api/v1/media/:id/url` — Generate fresh short-lived signed GET URL for media item.
- `PATCH /api/v1/media/:id` — Update media caption (auto-reverts verified memory unless `reverify: true`).
- `DELETE /api/v1/media/:id` — Soft-delete media row and delete physical object in storage.
