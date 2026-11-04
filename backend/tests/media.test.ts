import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Media Pipeline & Storage Provider (Phase 6)', () => {
  const app = createApp();

  let caregiverToken: string;
  let patientId: string;
  let uploadUrl: string;
  let storagePath: string;
  let mediaId: string;
  let readUrl: string;

  const testImageBuffer = Buffer.from('FAKE_JPEG_IMAGE_DATA_1234567890');

  beforeAll(async () => {
    // Login caregiver
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'anita@example.com',
        password: 'Password123!'
      });
    caregiverToken = loginRes.body.data.accessToken;

    // Get patient
    const patientsRes = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${caregiverToken}`);
    patientId = patientsRes.body.data[0].id;
  });

  describe('Validation & Security Guardrails', () => {
    it('rejects unsupported MIME types with 415', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          fileName: 'malicious.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 1024
        });

      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects files exceeding size limits with 413', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          fileName: 'huge.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 25 * 1024 * 1024 // 25 MB exceeds 10 MB limit
        });

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('Upload Pipeline & Temporary Read URLs', () => {
    it('generates a signed upload URL for valid image', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/upload-url`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          fileName: 'family-picnic.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: testImageBuffer.length
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data).toHaveProperty('storagePath');
      expect(res.body.data.storagePath).toMatch(/^patients\/[a-f0-9-]+\/[a-f0-9-]+\.jpg$/);

      uploadUrl = res.body.data.uploadUrl;
      storagePath = res.body.data.storagePath;
    });

    it('uploads binary file to storage using signed upload URL', async () => {
      const res = await request(app)
        .put(uploadUrl)
        .set('Content-Type', 'image/jpeg')
        .send(testImageBuffer);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('File uploaded successfully');
    });

    it('confirms the upload and creates Media record in database', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/media/confirm`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          storagePath,
          fileName: 'family-picnic.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: testImageBuffer.length,
          caption: 'Picnic under the banyan tree'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('readUrl');
      expect(res.body.data.mediaType).toBe('IMAGE');

      mediaId = res.body.data.id;
      readUrl = res.body.data.readUrl;
    });

    it('retrieves the uploaded binary file via temporary signed read URL', async () => {
      const res = await request(app).get(readUrl);

      expect(res.status).toBe(200);
      expect(Buffer.compare(res.body, testImageBuffer)).toBe(0);
    });

    it('generates a fresh signed read URL via GET /media/:id/url', async () => {
      const res = await request(app)
        .get(`/api/v1/media/${mediaId}/url`)
        .set('Authorization', `Bearer ${caregiverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('readUrl');
    });

    it('soft deletes media and deletes physical storage object', async () => {
      const res = await request(app)
        .delete(`/api/v1/media/${mediaId}`)
        .set('Authorization', `Bearer ${caregiverToken}`);

      expect(res.status).toBe(200);

      // Subsequent query should return 404
      const getRes = await request(app)
        .get(`/api/v1/media/${mediaId}/url`)
        .set('Authorization', `Bearer ${caregiverToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
