# MemoryBridge Private Media Upload Contract

> **Phase 7 Integration Guide & Contract Specification**  
> All media stored in MemoryBridge is strictly private. Media objects are never served through public, unauthenticated URLs. The client directly uploads media to secure storage using server-issued, short-lived V4 signed PUT URLs, and accesses media via short-lived signed GET URLs.

---

## 1. Upload Flow Overview

Media upload uses a 3-step intent-based protocol:

```
[ Frontend Client ]                    [ Backend API ]                  [ Storage Provider ]
         |                                    |                           (Firebase / Local)
         |  1. POST .../upload-url            |                                    |
         |----------------------------------->|                                    |
         |                                    |-- Verify Quota & Permissions       |
         |                                    |-- Generate Storage Key             |
         |                                    |-- Create MediaUpload Intent        |
         |                                    |-- Request V4 Signed Target ------->|
         |                                    |<-- Return Signed PUT URL ----------|
         |  2. { uploadId, uploadUrl, ... }   |                                    |
         |<-----------------------------------|                                    |
         |                                                                         |
         |  3. PUT [Raw Binary Stream] with Required Headers                       |
         |------------------------------------------------------------------------>|
         |<------------------ 200 OK with ETag ------------------------------------|
         |                                                                         |
         |  4. POST .../confirm { uploadId, caption? }                             |
         |----------------------------------->|                                    |
         |                                    |-- Stat Storage File -------------->|
         |                                    |<-- Real Size & MD5 ----------------|
         |                                    |-- Read Header & Verify Magic Bytes |
         |                                    |-- Enforce Safety Rules             |
         |                                    |-- Create Media Row & Bind Target   |
         |  5. { data: MediaItem, error: null}|                                    |
         |<-----------------------------------|                                    |
```

---

## 2. API Endpoints

### Step 1: Request Upload URL

**Endpoint:** `POST /api/v1/patients/:patientId/media/upload-url`  
**Authorization:** `Bearer <accessToken>` (Roles: `OWNER`, `CAREGIVER`, `FAMILY`)  
**Rate Limit:** 60 requests per 15 minutes per IP.

#### Request Body
```json
{
  "fileName": "family_picnic_2023.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 2457600,
  "purpose": "MEMORY_MEDIA",
  "memoryId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "targetId": null
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `fileName` | string (1-255) | Yes | Original file name (metadata only, sanitized by backend). |
| `mimeType` | string | Yes | Declared MIME type (must match extension allowlist). |
| `sizeBytes` | integer | Yes | Declared file size in bytes (must be within quota & limits). |
| `purpose` | enum | No | `MEMORY_MEDIA` (default), `PATIENT_PROFILE`, `PERSON_PROFILE`, `ALBUM_COVER`, `STORYBOOK_COVER`. |
| `memoryId` | UUID | No | Target Memory ID when purpose is `MEMORY_MEDIA`. |
| `targetId` | UUID | No | Target Person/Album/Storybook ID when purpose is a profile or cover. |

#### Allowed MIME Types & Limits
- **Images:** `.jpg`, `.jpeg` (`image/jpeg`), `.png` (`image/png`), `.webp` (`image/webp`) — Max: **10 MB**
- **Audio:** `.mp3` (`audio/mpeg`), `.wav` (`audio/wav`), `.m4a` (`audio/mp4`) — Max: **25 MB**
- **Video:** `.mp4` (`video/mp4`), `.webm` (`video/webm`) — Max: **200 MB**

#### Response (`201 Created`)
```json
{
  "data": {
    "uploadId": "c4b18274-cf4a-47fa-8067-160101d24c0d",
    "uploadUrl": "https://storage.googleapis.com/memorybridge.appspot.com/patients/...?GoogleAccessId=...",
    "method": "PUT",
    "requiredHeaders": {
      "Content-Type": "image/jpeg"
    },
    "expiresAt": "2026-11-08T18:15:00.000Z"
  },
  "error": null
}
```

---

### Step 2: Binary Upload directly to Storage Target

Send an HTTP `PUT` request directly to `uploadUrl`:

```http
PUT <uploadUrl> HTTP/1.1
Content-Type: image/jpeg
Content-Length: 2457600

[RAW BINARY DATA]
```

> **Important:**
> - Header `Content-Type` **must exactly match** the `requiredHeaders['Content-Type']`.
> - Do **not** send an `Authorization` header to Google Cloud Storage or Firebase.

---

### Step 3: Confirm Upload

**Endpoint:** `POST /api/v1/patients/:patientId/media/confirm`  
**Authorization:** `Bearer <accessToken>` (Must be the same user who initiated the upload intent)  
**Rate Limit:** 60 requests per 15 minutes per IP.

#### Request Body
```json
{
  "uploadId": "c4b18274-cf4a-47fa-8067-160101d24c0d",
  "caption": "Grandfather and Anita at the lake in 1982",
  "reverify": false
}
```

#### Response (`201 Created`)
```json
{
  "data": {
    "id": "e81d7634-1102-4fc4-8931-182390ab512e",
    "patientId": "1a2b3c4d-...",
    "memoryId": "9b1deb4d-...",
    "mediaType": "IMAGE",
    "fileName": "family_picnic_2023.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 2457600,
    "caption": "Grandfather and Anita at the lake in 1982",
    "uploadedBy": "5f6e7d8c-...",
    "createdAt": "2026-11-08T18:05:00.000Z",
    "url": "https://storage.googleapis.com/memorybridge.appspot.com/patients/...?GoogleAccessId=...Expires=..."
  },
  "error": null
}
```

---

## 3. Safety Rules on Verified Memories

When attaching, modifying, or deleting media attached to a memory that is currently `VERIFIED`:
1. The memory's status is **automatically reverted to `PENDING`** and `approvedById` is cleared.
2. A verification audit row is recorded.
3. **Exception:** If an `OWNER` or `CAREGIVER` explicitly passes `"reverify": true`, the `VERIFIED` status is preserved.

---

## 4. Frontend Example Implementation (Phase 7 Reference)

```typescript
// services/mediaUpload.ts
export async function uploadMediaFile(
  patientId: string,
  file: File,
  options: {
    purpose?: 'MEMORY_MEDIA' | 'PATIENT_PROFILE' | 'PERSON_PROFILE' | 'ALBUM_COVER' | 'STORYBOOK_COVER';
    memoryId?: string;
    targetId?: string;
    caption?: string;
    onProgress?: (percent: number) => void;
  }
) {
  // 1. Get signed upload URL
  const initRes = await fetch(`/api/v1/patients/${patientId}/media/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      purpose: options.purpose || 'MEMORY_MEDIA',
      memoryId: options.memoryId,
      targetId: options.targetId
    })
  });

  const initData = await initRes.json();
  if (!initRes.ok) throw new Error(initData.error?.message || 'Failed to initialize upload');

  const { uploadId, uploadUrl, requiredHeaders } = initData.data;

  // 2. Direct PUT to storage target (with XMLHttpRequest for progress tracking)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);

    for (const [k, v] of Object.entries(requiredHeaders)) {
      xhr.setRequestHeader(k, v as string);
    }

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          options.onProgress?.(Math.round((evt.loaded / evt.total) * 100));
        }
      };
    }

    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Storage upload failed')));
    xhr.onerror = () => reject(new Error('Network error during file upload'));
    xhr.send(file);
  });

  // 3. Confirm upload
  const confirmRes = await fetch(`/api/v1/patients/${patientId}/media/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify({
      uploadId,
      caption: options.caption
    })
  });

  const confirmData = await confirmRes.json();
  if (!confirmRes.ok) throw new Error(confirmData.error?.message || 'Failed to confirm upload');

  return confirmData.data;
}
```

