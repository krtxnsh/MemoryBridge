import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { MockStorageProvider, setStorageProvider } from '../src/storage';
import {
  getImageDescriptionProvider,
  resetImageDescriptionProvider
} from '../src/services/vision';
import { MockImageDescriptionProvider } from '../src/services/vision/mock.provider';
import { OpenAiVisionProvider } from '../src/services/vision/openai.provider';

describe('Vision provider factory & grounding', () => {
  const origProvider = (env as any).IMAGE_DESCRIPTION_PROVIDER;
  const origKey = (env as any).IMAGE_DESCRIPTION_API_KEY;

  afterAll(() => {
    (env as any).IMAGE_DESCRIPTION_PROVIDER = origProvider;
    (env as any).IMAGE_DESCRIPTION_API_KEY = origKey;
    resetImageDescriptionProvider();
  });

  it('mock provider drafts only from context and flags itself as a draft', async () => {
    const p = new MockImageDescriptionProvider();
    const r = await p.describe(
      { memoryTitle: 'Wedding Day', location: 'Delhi', approximateYear: 1975, peopleNames: ['Anita'] },
      1000
    );
    expect(r.provider).toBe('mock');
    expect(r.text).toContain('Wedding Day');
    expect(r.text.toLowerCase()).toContain('ai-suggested');
  });

  it('none => null; mock => instance; openai without key => null', () => {
    (env as any).IMAGE_DESCRIPTION_PROVIDER = 'none';
    resetImageDescriptionProvider();
    expect(getImageDescriptionProvider()).toBeNull();

    (env as any).IMAGE_DESCRIPTION_PROVIDER = 'mock';
    resetImageDescriptionProvider();
    expect(getImageDescriptionProvider()).toBeInstanceOf(MockImageDescriptionProvider);

    (env as any).IMAGE_DESCRIPTION_PROVIDER = 'openai';
    (env as any).IMAGE_DESCRIPTION_API_KEY = '';
    resetImageDescriptionProvider();
    expect(getImageDescriptionProvider()).toBeNull();

    (env as any).IMAGE_DESCRIPTION_API_KEY = 'sk-test';
    resetImageDescriptionProvider();
    expect(getImageDescriptionProvider()).toBeInstanceOf(OpenAiVisionProvider);
  });
});

describe('Caregiver-reviewed AI image descriptions (Phase 5)', () => {
  const app = createApp();
  const mockStorage = new MockStorageProvider();
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

  const caregiver = {
    email: `aidesc_care_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'AI Care',
    role: 'CAREGIVER'
  };
  const family = {
    email: `aidesc_family_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'AI Family',
    role: 'FAMILY_MEMBER'
  };

  let token: string;
  let familyToken: string;
  let familyId: string;
  let patientId: string;
  let tabletToken: string;
  let memoryId: string;
  let mediaId: string;

  const origProvider = (env as any).IMAGE_DESCRIPTION_PROVIDER;

  async function uploadImage(memId: string, caption?: string): Promise<string> {
    const url = await request(app)
      .post(`/api/v1/patients/${patientId}/media/upload-url`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'photo.png', mimeType: 'image/png', sizeBytes: validPng.length, memoryId: memId });
    const { uploadId } = url.body.data;
    const intent = await prisma.mediaUpload.findUnique({ where: { id: uploadId } });
    mockStorage.putObject(intent!.storagePath, validPng, 'image/png');
    const conf = await request(app)
      .post(`/api/v1/patients/${patientId}/media/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({ uploadId, caption, memoryId: memId });
    return conf.body.data.id;
  }

  beforeAll(async () => {
    setStorageProvider(mockStorage);
    (env as any).IMAGE_DESCRIPTION_PROVIDER = 'mock';
    resetImageDescriptionProvider();

    token = (await request(app).post('/api/v1/auth/register').send(caregiver)).body.data.accessToken;
    const fam = await request(app).post('/api/v1/auth/register').send(family);
    familyToken = fam.body.data.accessToken;
    familyId = fam.body.data.user.id;

    patientId = (
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullName: 'Rajiv Verma', relationship: 'Primary Caregiver' })
    ).body.data.id;

    await prisma.patientAccess.create({
      data: { userId: familyId, patientId, accessRole: 'FAMILY', relationship: 'Son' }
    });

    tabletToken = (
      await request(app)
        .post(`/api/v1/patients/${patientId}/patient-sessions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 1440 })
    ).body.data.sessionToken;

    memoryId = (
      await request(app)
        .post(`/api/v1/patients/${patientId}/memories`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Wedding Day', story: 'A happy day.', approximateYear: 1975, era: '1970s', tags: ['wedding'] })
    ).body.data.id;

    mediaId = await uploadImage(memoryId, 'Family caption');

    // Verify the memory so a patient tablet session can see its media.
    await request(app)
      .post(`/api/v1/memories/${memoryId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comments: 'ok' });
  });

  afterAll(async () => {
    (env as any).IMAGE_DESCRIPTION_PROVIDER = origProvider;
    resetImageDescriptionProvider();
    try {
      await prisma.patientProfile.deleteMany({ where: { id: patientId } });
      await prisma.user.deleteMany({ where: { email: { in: [caregiver.email, family.email] } } });
    } catch {
      /* ignore */
    }
  });

  it('caregiver generates a draft AI description stored separately as AI_SUGGESTED', async () => {
    const res = await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.aiDescriptionStatus).toBe('AI_SUGGESTED');
    expect(res.body.data.aiDescription).toContain('Wedding Day');
    expect(res.body.data.aiDescriptionProvider).toBe('mock');
    expect(res.body.data.aiDescriptionGeneratedAt).toBeTruthy();
    // The family-entered caption is untouched by generation.
    expect(res.body.data.caption).toBe('Family caption');
  });

  it('a patient NEVER sees an unapproved AI description', async () => {
    const res = await request(app)
      .get(`/api/v1/memories/${memoryId}/media`)
      .set('Authorization', `Bearer ${tabletToken}`);
    expect(res.status).toBe(200);
    const item = res.body.data.items.find((m: any) => m.id === mediaId);
    expect(item).toBeTruthy();
    expect(item).not.toHaveProperty('aiDescription');
    expect(item).not.toHaveProperty('aiDescriptionStatus');
    expect(item.caption).toBe('Family caption'); // still the family text, not AI
  });

  it('FAMILY and patient sessions cannot generate AI descriptions', async () => {
    const fam = await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({});
    expect([403, 404]).toContain(fam.status);

    const pat = await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description`)
      .set('Authorization', `Bearer ${tabletToken}`)
      .send({});
    expect([401, 403, 404]).toContain(pat.status);
  });

  it('appears in the caregiver AI-description review queue', async () => {
    const res = await request(app)
      .get(`/api/v1/patients/${patientId}/media/ai-descriptions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((m: any) => m.id === mediaId)).toBe(true);
  });

  it('approval with caregiver edits promotes the text to the patient-visible caption', async () => {
    const res = await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'approve', text: 'Rajiv and Anita on their wedding day in 1975.' });

    expect(res.status).toBe(200);
    expect(res.body.data.aiDescriptionStatus).toBe('APPROVED');
    expect(res.body.data.aiDescriptionApprovedById).toBeTruthy();
    expect(res.body.data.caption).toBe('Rajiv and Anita on their wedding day in 1975.');

    // Now the patient sees the approved caption.
    const patView = await request(app)
      .get(`/api/v1/memories/${memoryId}/media`)
      .set('Authorization', `Bearer ${tabletToken}`);
    const item = patView.body.data.items.find((m: any) => m.id === mediaId);
    expect(item.caption).toBe('Rajiv and Anita on their wedding day in 1975.');
    expect(item).not.toHaveProperty('aiDescription');
  });

  it('reviewing when nothing is pending is rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_PENDING_AI_DESCRIPTION');
  });

  it('a regenerated draft can be rejected without changing the caption', async () => {
    await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    const res = await request(app)
      .post(`/api/v1/media/${mediaId}/ai-description/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'reject' });
    expect(res.status).toBe(200);
    expect(res.body.data.aiDescriptionStatus).toBe('REJECTED');
    // Caption stays as the previously approved text.
    expect(res.body.data.caption).toBe('Rajiv and Anita on their wedding day in 1975.');
  });

  it('returns 503 when the provider is disabled', async () => {
    (env as any).IMAGE_DESCRIPTION_PROVIDER = 'none';
    resetImageDescriptionProvider();
    const other = await uploadImage(memoryId);
    const res = await request(app)
      .post(`/api/v1/media/${other}/ai-description`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(503);
    (env as any).IMAGE_DESCRIPTION_PROVIDER = 'mock';
    resetImageDescriptionProvider();
  });
});
