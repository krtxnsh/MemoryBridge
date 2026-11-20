import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Auth & Access Control API (Phase 4)', () => {
  const app = createApp();

  const testUserA = {
    email: `test_user_a_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Test User A'
  };

  const testUserB = {
    email: `test_user_b_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Test User B'
  };

  let tokenA: string;
  let refreshCookieA: string;
  let tokenB: string;
  let patientAId: string;
  let patientSessionToken: string;
  let sessionId: string;

  afterAll(async () => {
    // Clean up test data
    try {
      if (patientAId) {
        await prisma.patientProfile.deleteMany({ where: { id: patientAId } });
      }
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [testUserA.email, testUserB.email]
          }
        }
      });
    } catch (e) {
      // ignore
    }
  });

  describe('Registration & Authentication', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserA.email,
          password: testUserA.password,
          name: testUserA.name,
          role: 'CAREGIVER'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('email', testUserA.email);
      expect(res.body.data.user).toHaveProperty('role', 'CAREGIVER');
      expect(res.headers['set-cookie']).toBeDefined();

      tokenA = res.body.data.accessToken;
      refreshCookieA = res.headers['set-cookie'][0];
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserA.email,
          password: 'AnotherPassword123!',
          name: 'Duplicate'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects invalid password on login with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserA.email,
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('logs in successfully and returns access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserA.email,
          password: testUserA.password
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testUserA.email);
      tokenA = res.body.data.accessToken;
      refreshCookieA = res.headers['set-cookie'][0];
    });

    it('rotates refresh token on /api/v1/auth/refresh', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookieA]);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();

      // Update cookie to rotated token
      refreshCookieA = res.headers['set-cookie'][0];
    });

    it('returns current user profile on GET /api/v1/auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUserA.email);
      expect(Array.isArray(res.body.data.patientAccess)).toBe(true);
    });

    it('rejects unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Tenant Isolation & Access Control Matrix', () => {
    beforeAll(async () => {
      // Register User B
      const resB = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUserB.email,
          password: testUserB.password,
          name: testUserB.name,
          role: 'FAMILY_MEMBER'
        });
      tokenB = resB.body.data.accessToken;

      // User A creates a patient profile
      const createRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Test Isolation Patient',
          relationship: 'Primary Caregiver',
          preferredLanguage: 'en'
        });

      patientAId = createRes.body.data.id;
    });

    it('allows User A (OWNER) to view the patient', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(patientAId);
    });

    it('returns 404 Not Found when User B attempts to access User A patient (isolation check)', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Must return 404 (not 403) to prevent resource enumeration
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PATIENT_NOT_FOUND');
    });

    it('issues a time-limited patient session token for tablet mode', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/patient-sessions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          durationMinutes: 1440
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('sessionToken');
      expect(res.body.data.session).toHaveProperty('id');
      expect(res.body.data.session.patientId).toBe(patientAId);

      patientSessionToken = res.body.data.sessionToken;
      sessionId = res.body.data.session.id;
    });

    it('lists active patient sessions for caregiver', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}/patient-sessions`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((s: any) => s.id === sessionId)).toBe(true);
    });

    it('allows caregiver to revoke a patient session', async () => {
      const res = await request(app)
        .delete(`/api/v1/patient-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.revokedAt).not.toBeNull();
    });

    it('prevents User B from revoking User A patient session', async () => {
      const res = await request(app)
        .delete(`/api/v1/patient-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Must return 404 to avoid leaking session existence
      expect(res.status).toBe(404);
    });
  });

  describe('Session Invalidation on Logout', () => {
    it('invalidates tokens and increments tokenVersion upon logout', async () => {
      // Logout User A
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('Cookie', [refreshCookieA]);

      expect(res.status).toBe(200);

      // Access token should now be rejected because tokenVersion changed
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(meRes.status).toBe(401);
      expect(meRes.body.error.code).toBe('TOKEN_REVOKED');
    });
  });
});
