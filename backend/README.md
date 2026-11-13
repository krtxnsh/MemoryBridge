# MemoryBridge Backend

Secure, modular REST backend for MemoryBridge.

## Features & Architecture

- **Clean Layered Architecture**: Routes → Controllers → Services → Repositories (Prisma ORM).
- **Security & Authorization**:
  - JWT authentication with access/refresh rotation.
  - Granular patient access control (`OWNER`, `CAREGIVER`, `FAMILY`, `VIEWER`, and tablet session tokens).
  - Anti-enumeration defense (all malformed IDs return 400, missing/unauthorized resources return identical 404).
  - Protection against mass assignment.
- **Private Media Storage (Phase 6)**:
  - Direct client uploads via short-lived V4 signed PUT URLs.
  - Server-side upload intents (`MediaUpload`) for integrity and cleanup.
  - Magic-byte validation (`image/jpeg`, `image/png`, `image/webp`, `audio/mpeg`, `audio/wav`, `audio/mp4`, `video/mp4`, `video/webm`).
  - Pluggable storage providers (`STORAGE_PROVIDER=local|firebase|mock`).
  - Safety rule: Mutating/attaching media on `VERIFIED` memories auto-reverts status to `PENDING`.
- **Comprehensive Test Suite**: 101 automated tests across 5 test suites.

## Available Scripts

- `npm run dev` — Run development server with `tsx watch`.
- `npm run build` — Compile TypeScript to `dist/`.
- `npm run start` — Run production server.
- `npm run typecheck` — Run TypeScript compiler check without emitting files (`tsc --noEmit`).
- `npm run test` — Run complete Vitest test suite.
- `npm run db:start` — Start embedded local PostgreSQL database.
- `npm run storage:cleanup` — Cleanup expired upload intents and orphaned files in storage.
- `npm run firebase:smoke` — Run smoke test against configured Firebase Storage bucket.

## Storage Configuration

In `.env`:
```env
# Provider choice: local (dev default), firebase (production requirement), mock (test default)
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads

# Firebase Storage Credentials (required when STORAGE_PROVIDER=firebase)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
```

## Testing & Quality Gates

Run the test suite:
```bash
npm --prefix backend run test
```

Run TypeScript verification:
```bash
npm --prefix backend run typecheck
```

