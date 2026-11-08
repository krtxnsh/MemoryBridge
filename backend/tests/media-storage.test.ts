import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { VerificationStatus, AccessRole, MediaUploadPurpose } from '@prisma/client';
import { storage, MockStorageProvider, setStorageProvider } from '../src/storage';
import { cleanupExpiredUploads } from '../scripts/storage-cleanup';
import { parseEnv } from '../src/config/env';

describe('Phase 6: Private Media Storage Test Suite', () => {
  const app = createApp();
  const mockStorage = new MockStorageProvider();

  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60
  ]);
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
  ]);
  const invalidBuffer = Buffer.from('THIS IS INVALID CONTENT GARBAGE DATA');

  const ownerUser = {
    email: `storage_owner_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Storage Owner',
    role: 'CAREGIVER'
  };

  const familyUser = {
    email: `storage_family_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Storage Family',
    role: 'FAMILY_MEMBER'
  };

  const viewerUser = {
    email: `storage_viewer_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Storage Viewer',
    role: 'FAMILY_MEMBER'
  };

  const strangerUser = {
    email: `storage_stranger_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Storage Stranger',
    role: 'CAREGIVER'
  };

  let ownerToken: string;
  let ownerId: string;
  let familyToken: string;
  let familyId: string;
  let viewerToken: string;
  let viewerId: string;
  let strangerToken: string;

  let patientId: string;
  let personId: string;
  let albumId: string;
  let storybookId: string;
  let verifiedMemoryId: string;
  let pendingMemoryId: string;
  let patientTabletToken: string;

  beforeAll(async () => {
    setStorageProvider(mockStorage);

    // 1. Register users
    const resOwner = await request(app).post('/api/v1/auth/register').send(ownerUser);
    expect(resOwner.status).toBe(201);
    ownerToken = resOwner.body.data.accessToken;
    ownerId = resOwner.body.data.user.id;

    const resFamily = await request(app).post('/api/v1/auth/register').send(familyUser);
    expect(resFamily.status).toBe(201);
    familyToken = resFamily.body.data.accessToken;
    familyId = resFamily.body.data.user.id;

    const resViewer = await request(app).post('/api/v1/auth/register').send(viewerUser);
    expect(resViewer.status).toBe(201);
    viewerToken = resViewer.body.data.accessToken;
    viewerId = resViewer.body.data.user.id;

    const resStranger = await request(app).post('/api/v1/auth/register').send(strangerUser);
    expect(resStranger.status).toBe(201);
    strangerToken = resStranger.body.data.accessToken;

    // 2. Create patient by owner
    const resPatient = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        fullName: 'Media Test Patient',
        relationship: 'Grandfather',
        dateOfBirth: '1945-05-15'
      });
    patientId = resPatient.body.data.id;

    // 3. Grant access to family & viewer
    await prisma.patientAccess.create({
      data: {
        patientId,
        userId: familyId,
        accessRole: AccessRole.FAMILY,
        relationship: 'Granddaughter'
      }
    });

    await prisma.patientAccess.create({
      data: {
        patientId,
        userId: viewerId,
        accessRole: AccessRole.VIEWER,
        relationship: 'Friend'
      }
    });

    // 4. Create Person, Album, Storybook
    const resPerson = await request(app)
      .post(`/api/v1/patients/${patientId}/people`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        fullName: 'Relative Person',
        relationship: 'Daughter'
      });
    personId = resPerson.body.data.id;

    const resAlbum = await request(app)
      .post(`/api/v1/patients/${patientId}/albums`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Vacation Album'
      });
    albumId = resAlbum.body.data.id;

    const resStorybook = await request(app)
      .post(`/api/v1/patients/${patientId}/storybooks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Childhood Tales'
      });
    storybookId = resStorybook.body.data.id;

    // 5. Create a memory and verify it
    const resMem = await request(app)
      .post(`/api/v1/patients/${patientId}/memories`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Golden Jubilee Celebration',
        story: 'A wonderful anniversary celebrated with all relatives.',
        era: 'MID'
      });
    verifiedMemoryId = resMem.body.data.id;

    await request(app)
      .post(`/api/v1/memories/${verifiedMemoryId}/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        status: 'VERIFIED',
        comments: 'Verified for album'
      });

    // Create a pending memory
    const resMemPending = await request(app)
      .post(`/api/v1/patients/${patientId}/memories`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Pending Picnic Memory',
        story: 'A picnic at the beach.',
        era: 'LATE'
      });
    pendingMemoryId = resMemPending.body.data.id;

    // 6. Generate patient tablet session token
    const resSession = await request(app)
      .post(`/api/v1/patients/${patientId}/patient-sessions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ durationMinutes: 1440 });
    expect(resSession.status).toBe(201);
    patientTabletToken = resSession.body.data.sessionToken;
  });

  afterAll(async () => {
    mockStorage.clear();
    await prisma.mediaUpload.deleteMany({ where: { patientId } });
    await prisma.media.deleteMany({ where: { patientId } });
    await prisma.patientProfile.deleteMany({ where: { id: patientId } });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, familyUser.email, viewerUser.email, strangerUser.email] } }
    });
  });

  describe('1. Upload URL Generation (POST /api/v1/patients/:patientId/media/upload-url)', () => {
    it('generates a signed upload URL and MediaUpload intent for valid parameters', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'family_photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 50,
          purpose: 'MEMORY_MEDIA',
          memoryId: pendingMemoryId
        });

      expect(res.status).toBe(201);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toHaveProperty('uploadId');
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data.method).toBe('PUT');
      expect(res.body.data.requiredHeaders['Content-Type']).toBe('image/jpeg');
      expect(res.body.data).toHaveProperty('expiresAt');

      // Verify DB record
      const intent = await prisma.mediaUpload.findUnique({
        where: { id: res.body.data.uploadId }
      });
      expect(intent).not.toBeNull();
      expect(intent?.patientId).toBe(patientId);
      expect(intent?.userId).toBe(ownerId);
      expect(intent?.status).toBe('PENDING');
      expect(intent?.storagePath).toContain(`patients/${patientId}/images/`);
    });

    it('rejects unsupported MIME types (e.g. application/pdf)', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_MEDIA_TYPE');
    });

    it('rejects MIME type and extension mismatch (e.g. .png with image/jpeg)', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'photo.png',
          mimeType: 'image/jpeg',
          sizeBytes: 1024
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_MEDIA_TYPE');
    });

    it('rejects files exceeding type-specific size limit', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'huge_image.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 15 * 1024 * 1024 // 15MB > 10MB limit
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('rejects upload URL generation by VIEWER or tablet session', async () => {
      const resViewer = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024
        });
      // requirePatientAccess checks minRole: FAMILY -> VIEWER returns 404 PATIENT_NOT_FOUND to avoid enumeration
      expect([403, 404]).toContain(resViewer.status);

      const resTablet = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${patientTabletToken}`)
        .send({
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024
        });
      expect([403, 404]).toContain(resTablet.status);
    });

    it('rejects non-owner/caregiver attempting to upload PATIENT_PROFILE', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${familyToken}`)
        .send({
          fileName: 'profile.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          purpose: 'PATIENT_PROFILE'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects memoryId belonging to a different patient', async () => {
      // Create stranger patient
      const resStrangerPatient = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ fullName: 'Stranger Patient', relationship: 'Uncle' });
      const strangerPatientId = resStrangerPatient.body.data.id;

      const resStrangerMem = await request(app)
        .post(`/api/v1/patients/${strangerPatientId}/memories`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ title: 'Stranger Memory', story: 'Foreign story', era: 'MID' });
      const strangerMemId = resStrangerMem.body.data.id;

      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'cross_attack.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          memoryId: strangerMemId
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');

      // Cleanup stranger patient
      await prisma.patientProfile.deleteMany({ where: { id: strangerPatientId } });
    });
  });

  describe('2. Confirm Upload (POST /api/v1/patients/:patientId/media/confirm)', () => {
    it('confirms upload, validates magic bytes, creates Media row, and returns signed URL', async () => {
      // 1. Get upload URL
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'wedding.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length
        });
      const { uploadId } = resUrl.body.data;

      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      expect(intent).not.toBeNull();

      // 2. Put valid JPEG into mock storage
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      // 3. Confirm upload
      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          uploadId,
          caption: 'Beautiful wedding anniversary'
        });

      expect(resConfirm.status).toBe(201);
      expect(resConfirm.body.error).toBeNull();
      expect(resConfirm.body.data).toHaveProperty('id');
      expect(resConfirm.body.data.caption).toBe('Beautiful wedding anniversary');
      expect(resConfirm.body.data.mediaType).toBe('IMAGE');
      expect(resConfirm.body.data.url).toContain(intent!.storagePath);

      // Verify intent status updated to CONFIRMED
      const updatedIntent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      expect(updatedIntent?.status).toBe('CONFIRMED');
      expect(updatedIntent?.mediaId).toBe(resConfirm.body.data.id);
    });

    it('is idempotent: confirming the same uploadId twice returns existing media', async () => {
      // 1. Get upload URL
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'idempotent_test.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length
        });
      const { uploadId } = resUrl.body.data;

      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validPngBuffer, 'image/png');

      // 2. Confirm first time
      const res1 = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId, caption: 'First confirm' });
      expect(res1.status).toBe(201);

      // 3. Confirm second time
      const res2 = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId, caption: 'Second confirm attempt' });
      expect(res2.status).toBe(201);
      expect(res2.body.data.id).toBe(res1.body.data.id);
    });

    it('rejects confirmation if file is missing in storage target', async () => {
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'ghost_file.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024
        });
      const { uploadId } = resUrl.body.data;

      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId });

      expect(resConfirm.status).toBe(400);
      expect(resConfirm.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('rejects confirmation and deletes storage object if magic bytes mismatch declared MIME', async () => {
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'spoofed_file.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: invalidBuffer.length
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });

      // Put garbage buffer without JPEG header
      mockStorage.putObject(intent!.storagePath, invalidBuffer, 'image/jpeg');

      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId });

      expect(resConfirm.status).toBe(400);
      expect(resConfirm.body.error.code).toBe('INVALID_FILE_SIGNATURE');

      // Intent marked FAILED and physical file deleted
      const updatedIntent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      expect(updatedIntent?.status).toBe('FAILED');
      const stat = await mockStorage.statObject(intent!.storagePath);
      expect(stat.exists).toBe(false);
    });

    it('prevents IDOR: User B cannot confirm User A’s upload intent', async () => {
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'user_a_private.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${familyToken}`) // Family user trying to confirm owner's intent
        .send({ uploadId });

      expect(resConfirm.status).toBe(403);
      expect(resConfirm.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Image Binding for Profile & Cover Images', () => {
    it('binds image to PatientProfile.profileImage on PATIENT_PROFILE confirm', async () => {
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'patient_avatar.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length,
          purpose: 'PATIENT_PROFILE'
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId });

      const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
      expect(patient?.profileImage).toBe(intent!.storagePath);

      // Verify GET /api/v1/patients/:id returns signed read URL
      const resPatient = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(resPatient.status).toBe(200);
      expect(resPatient.body.data.profileImage).toContain(intent!.storagePath);
    });

    it('binds image to Person.profileImage on PERSON_PROFILE confirm', async () => {
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'daughter_avatar.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length,
          purpose: 'PERSON_PROFILE',
          targetId: personId
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId });

      const person = await prisma.person.findUnique({ where: { id: personId } });
      expect(person?.profileImage).toBe(intent!.storagePath);
    });

    it('binds cover image to Album and Storybook', async () => {
      // Album cover
      const resAlbumUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'album_cover.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
          purpose: 'ALBUM_COVER',
          targetId: albumId
        });
      const intentAlbum = await prisma.mediaUpload.findUnique({ where: { id: resAlbumUrl.body.data.uploadId } });
      mockStorage.putObject(intentAlbum!.storagePath, validPngBuffer, 'image/png');

      await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId: resAlbumUrl.body.data.uploadId });

      const album = await prisma.album.findUnique({ where: { id: albumId } });
      expect(album?.coverImage).toBe(intentAlbum!.storagePath);

      // Storybook cover
      const resStoryUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'story_cover.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
          purpose: 'STORYBOOK_COVER',
          targetId: storybookId
        });
      const intentStory = await prisma.mediaUpload.findUnique({ where: { id: resStoryUrl.body.data.uploadId } });
      mockStorage.putObject(intentStory!.storagePath, validPngBuffer, 'image/png');

      await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId: resStoryUrl.body.data.uploadId });

      const storybook = await prisma.storybook.findUnique({ where: { id: storybookId } });
      expect(storybook?.coverImage).toBe(intentStory!.storagePath);
    });
  });

  describe('4. Safety Rule on VERIFIED Memories', () => {
    it('auto-reverts a VERIFIED memory to PENDING when media is attached without reverify', async () => {
      // 1. Memory is currently VERIFIED
      const memBefore = await prisma.memory.findUnique({ where: { id: verifiedMemoryId } });
      expect(memBefore?.verificationStatus).toBe(VerificationStatus.VERIFIED);

      // 2. Upload media targeting this memory
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'revert_test.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length,
          memoryId: verifiedMemoryId
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      // 3. Confirm without reverify: true
      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId });
      expect(resConfirm.status).toBe(201);

      // 4. Memory must now be PENDING
      const memAfter = await prisma.memory.findUnique({ where: { id: verifiedMemoryId } });
      expect(memAfter?.verificationStatus).toBe(VerificationStatus.PENDING);
      expect(memAfter?.approvedById).toBeNull();

      // Verification log created
      const verRecord = await prisma.verification.findFirst({
        where: { memoryId: verifiedMemoryId, status: VerificationStatus.PENDING },
        orderBy: { createdAt: 'desc' }
      });
      expect(verRecord).not.toBeNull();
      expect(verRecord?.comments).toContain('Auto-reverted');
    });

    it('preserves VERIFIED status when reverify: true is provided by OWNER', async () => {
      // Re-verify memory first
      await request(app)
        .post(`/api/v1/memories/${verifiedMemoryId}/verify`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'VERIFIED', comments: 'Re-verifying memory' });

      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'keep_verified.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length,
          memoryId: verifiedMemoryId
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      // Confirm with reverify: true
      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId, reverify: true });
      expect(resConfirm.status).toBe(201);

      // Memory must remain VERIFIED
      const mem = await prisma.memory.findUnique({ where: { id: verifiedMemoryId } });
      expect(mem?.verificationStatus).toBe(VerificationStatus.VERIFIED);
    });
  });

  describe('5. Media List, URL, Update & Delete Endpoints', () => {
    let createdMediaId: string;

    beforeAll(async () => {
      const resUrl = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fileName: 'item_to_delete.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: validJpegBuffer.length
        });
      const { uploadId } = resUrl.body.data;
      const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
      mockStorage.putObject(intent!.storagePath, validJpegBuffer, 'image/jpeg');

      const resConfirm = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ uploadId, caption: 'Initial caption' });
      createdMediaId = resConfirm.body.data.id;
    });

    it('lists media with pagination (GET /api/v1/patients/:patientId/media)', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/media`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('fetches fresh signed read URL (GET /api/v1/media/:id/url)', async () => {
      const res = await request(app)
        .get(`/api/v1/media/${createdMediaId}/url`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data.id).toBe(createdMediaId);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data).toHaveProperty('expiresAt');
    });

    it('updates media caption (PATCH /api/v1/media/:id)', async () => {
      const res = await request(app)
        .patch(`/api/v1/media/${createdMediaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ caption: 'Updated caption text' });

      expect(res.status).toBe(200);
      expect(res.body.data.caption).toBe('Updated caption text');
    });

    it('soft deletes media and cleans up storage object (DELETE /api/v1/media/:id)', async () => {
      const media = await prisma.media.findUnique({ where: { id: createdMediaId } });
      expect(media).not.toBeNull();

      const res = await request(app)
        .delete(`/api/v1/media/${createdMediaId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdMediaId);

      // Verify soft delete in DB
      const softDeleted = await prisma.media.findUnique({ where: { id: createdMediaId } });
      expect(softDeleted?.deletedAt).not.toBeNull();

      // Verify storage object deleted
      const stat = await mockStorage.statObject(media!.storagePath);
      expect(stat.exists).toBe(false);

      // Enumerate defense: querying deleted media returns 404
      const resGet = await request(app)
        .get(`/api/v1/media/${createdMediaId}/url`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(resGet.status).toBe(404);
    });
  });

  describe('6. Storage Cleanup Script (cleanupExpiredUploads)', () => {
    it('cleans up expired pending upload intents and storage files', async () => {
      // Create an expired intent manually
      const expiredPath = `patients/${patientId}/images/expired_file.jpg`;
      mockStorage.putObject(expiredPath, validJpegBuffer, 'image/jpeg');

      const expiredIntent = await prisma.mediaUpload.create({
        data: {
          patientId,
          userId: ownerId,
          storagePath: expiredPath,
          declaredMimeType: 'image/jpeg',
          declaredSizeBytes: validJpegBuffer.length,
          status: 'PENDING',
          expiresAt: new Date(Date.now() - 1000 * 60) // 1 minute in the past
        }
      });

      const { expiredIntentsCleaned } = await cleanupExpiredUploads();
      expect(expiredIntentsCleaned).toBeGreaterThanOrEqual(1);

      // Intent status marked EXPIRED
      const updated = await prisma.mediaUpload.findUnique({ where: { id: expiredIntent.id } });
      expect(updated?.status).toBe('EXPIRED');

      // Storage object deleted
      const stat = await mockStorage.statObject(expiredPath);
      expect(stat.exists).toBe(false);
    });
  });

  describe('7. Environment & Boot Validation Checks', () => {
    it('fails boot if STORAGE_PROVIDER=local when NODE_ENV=production', () => {
      expect(() => {
        parseEnv({
          ...process.env,
          NODE_ENV: 'production',
          STORAGE_PROVIDER: 'local',
          JWT_ACCESS_SECRET: 'production_super_secret_key_minimum_32_characters_long',
          JWT_REFRESH_SECRET: 'production_super_secret_refresh_key_32_characters'
        });
      }).toThrow(/STORAGE_PROVIDER=local is forbidden in production/i);
    });

    it('fails boot if STORAGE_PROVIDER=firebase without required credentials', () => {
      expect(() => {
        parseEnv({
          ...process.env,
          NODE_ENV: 'development',
          STORAGE_PROVIDER: 'firebase',
          FIREBASE_PROJECT_ID: '',
          FIREBASE_CLIENT_EMAIL: '',
          FIREBASE_STORAGE_BUCKET: ''
        });
      }).toThrow(/FIREBASE_PROJECT_ID is required/i);
    });
  });
});
