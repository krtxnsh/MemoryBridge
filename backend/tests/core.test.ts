import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Core Domain APIs & Dementia Safety (Phase 5)', () => {
  const app = createApp();

  let caregiverToken: string;
  let familyToken: string;
  let patientSessionToken: string;
  let patientId: string;
  let pendingMemoryId: string;
  let verifiedMemoryId: string;
  let personId: string;
  let routineItemId: string;

  beforeAll(async () => {
    // 1. Login seeded caregiver (anita@example.com / Password123!)
    const caregiverRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'anita@example.com',
        password: 'Password123!'
      });
    caregiverToken = caregiverRes.body.data.accessToken;

    // 2. Login seeded family member (riya@example.com / Password123!)
    const familyRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'riya@example.com',
        password: 'Password123!'
      });
    familyToken = familyRes.body.data.accessToken;

    // 3. Get Rajiv Sharma's patient profile
    const patientsRes = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${caregiverToken}`);
    const rajiv = patientsRes.body.data[0];
    patientId = rajiv.id;

    // 4. Issue patient tablet session token
    const sessionRes = await request(app)
      .post(`/api/v1/patients/${patientId}/patient-sessions`)
      .set('Authorization', `Bearer ${caregiverToken}`)
      .send({ durationMinutes: 1440 });
    patientSessionToken = sessionRes.body.data.sessionToken;
  });

  describe('1. Dementia Safety & Memory Isolation', () => {
    it('family member creates memory which starts quarantined in PENDING status', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/memories`)
        .set('Authorization', `Bearer ${familyToken}`)
        .send({
          title: 'Unconfirmed Picnic in Mussoorie',
          story: 'A peaceful picnic in the hills with apple trees.',
          era: 'Golden Years',
          location: 'Mussoorie'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.verificationStatus).toBe('PENDING');
      pendingMemoryId = res.body.data.id;
    });

    it('patient tablet mode strictly cannot see PENDING memories', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/memories`)
        .set('Authorization', `Bearer ${patientSessionToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((m: any) => m.id);
      expect(ids).not.toContain(pendingMemoryId);

      // Verify all returned memories are strictly VERIFIED
      for (const m of res.body.data) {
        expect(m.verificationStatus).toBe('VERIFIED');
      }
    });

    it('caregiver verifies the pending memory', async () => {
      const res = await request(app)
        .post(`/api/v1/memories/${pendingMemoryId}/verify`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          status: 'VERIFIED',
          comments: 'Confirmed with family photos'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.memory.verificationStatus).toBe('VERIFIED');
    });

    it('patient tablet mode can now see the newly verified memory', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/memories`)
        .set('Authorization', `Bearer ${patientSessionToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((m: any) => m.id);
      expect(ids).toContain(pendingMemoryId);
    });
  });

  describe('2. Mira Companion Deterministic Safety Rules', () => {
    it('Test 1: Verified Goa Query returns 1998 Goa memory card', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/conversations/messages`)
        .set('Authorization', `Bearer ${patientSessionToken}`)
        .send({
          message: 'Tell me about my Goa trip'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toContain('Goa in 1998');
      expect(res.body.data.memoryCard).toBeDefined();
    });

    it('Test 2: Pending/Unverified Memory Query triggers safety quarantine message', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/conversations/messages`)
        .set('Authorization', `Bearer ${patientSessionToken}`)
        .send({
          message: 'Tell me about Kathmandu Nepal'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toContain("hasn't been confirmed yet");
      expect(res.body.data.memoryCard).toBeNull();
    });

    it('Test 3: Unknown query returns exact required fallback response', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/conversations/messages`)
        .set('Authorization', `Bearer ${patientSessionToken}`)
        .send({
          message: 'Tell me about my trip to Paris in 2010'
        });

      expect(res.status).toBe(201);
      const expectedFallback = "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";
      expect(res.body.data.text).toBe(expectedFallback);
    });

    it('Test 4: Wedding Query returns November 22, 1985 and Anita', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/conversations/messages`)
        .set('Authorization', `Bearer ${patientSessionToken}`)
        .send({
          message: 'What happened on my wedding day?'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toContain('November 22, 1985');
      expect(res.body.data.text).toContain('Anita');
      expect(res.body.data.memoryCard).toBeDefined();
    });
  });

  describe('3. People, Relationships & Connections Graph', () => {
    it('adds a person to the family circle', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientId}/people`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          fullName: 'Uncle Ramesh',
          relationship: 'Brother',
          birthYear: 1955
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fullName).toBe('Uncle Ramesh');
      personId = res.body.data.id;
    });

    it('lists people with shared memory counts', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/people`)
        .set('Authorization', `Bearer ${patientSessionToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const anita = res.body.data.find((p: any) => p.fullName === 'Anita');
      expect(anita).toBeDefined();
      expect(anita.sharedMemoryCount).toBeGreaterThanOrEqual(1);
    });

    it('generates connections graph with nodes and links', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientId}/graph`)
        .set('Authorization', `Bearer ${caregiverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('nodes');
      expect(res.body.data).toHaveProperty('links');
      expect(res.body.data.nodes.length).toBeGreaterThan(0);
      expect(res.body.data.links.length).toBeGreaterThan(0);
    });
  });

  describe('4. Routine & Diary Management', () => {
    it('creates a routine item and allows patient to toggle complete', async () => {
      // 1. Caregiver creates routine item
      const createRes = await request(app)
        .post(`/api/v1/patients/${patientId}/routine`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          title: 'Evening Chamomile Tea',
          scheduledTime: '07:30 PM',
          period: 'Evening',
          category: 'meal',
          notes: 'Warm tea with honey'
        });

      expect(createRes.status).toBe(201);
      routineItemId = createRes.body.data.id;
      expect(createRes.body.data.completed).toBe(false);

      // 2. Patient tablet mode toggles complete
      const toggleRes = await request(app)
        .patch(`/api/v1/routine/${routineItemId}/complete`)
        .set('Authorization', `Bearer ${patientSessionToken}`)
        .send({ completed: true });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.data.completed).toBe(true);
    });

    it('upserts and retrieves diary entry', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const putRes = await request(app)
        .put(`/api/v1/patients/${patientId}/diary`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          date: today,
          weather: 'Gentle breeze, 22°C',
          greeting: 'A peaceful evening, Rajiv',
          morningNote: 'Walked in the lawn with tea',
          afternoonNote: 'Looked at Goa photo album',
          eveningNote: 'Listened to classical ragas',
          caregiverSign: 'Anita'
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.weather).toBe('Gentle breeze, 22°C');

      const getRes = await request(app)
        .get(`/api/v1/patients/${patientId}/diary?date=${today}`)
        .set('Authorization', `Bearer ${patientSessionToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.morningNote).toBe('Walked in the lawn with tea');
    });
  });

  describe('5. Storybooks & Albums', () => {
    it('lists albums and storybooks', async () => {
      const albumsRes = await request(app)
        .get(`/api/v1/patients/${patientId}/albums`)
        .set('Authorization', `Bearer ${patientSessionToken}`);

      expect(albumsRes.status).toBe(200);
      expect(albumsRes.body.data.length).toBeGreaterThanOrEqual(1);

      const storybookRes = await request(app)
        .post(`/api/v1/patients/${patientId}/storybooks`)
        .set('Authorization', `Bearer ${caregiverToken}`)
        .send({
          title: 'My Journeys with Anita',
          description: 'A curated journey through the years'
        });

      expect(storybookRes.status).toBe(201);
      expect(storybookRes.body.data.title).toBe('My Journeys with Anita');
    });
  });
});
