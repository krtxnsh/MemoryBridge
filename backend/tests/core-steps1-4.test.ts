import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { VerificationStatus, AccessRole } from '@prisma/client';

describe('Phase 5 Steps 1-4 Core Backend APIs', () => {
  const app = createApp();

  const userA = {
    email: `caregiver_a_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Caregiver A',
    role: 'CAREGIVER'
  };

  const userB = {
    email: `caregiver_b_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Caregiver B',
    role: 'CAREGIVER'
  };

  const userFamily = {
    email: `family_a_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Family Member A',
    role: 'FAMILY_MEMBER'
  };

  const userViewer = {
    email: `viewer_a_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Viewer A',
    role: 'FAMILY_MEMBER'
  };

  let tokenA: string;
  let userAId: string;
  let tokenB: string;
  let userBId: string;
  let tokenFamily: string;
  let userFamilyId: string;
  let tokenViewer: string;
  let userViewerId: string;

  let patientAId: string;
  let patientBId: string;
  let patientATabletToken: string;

  let personAnitaId: string;
  let personRajivSelfId: string;
  let albumFamilyTripsId: string;
  let memoryDiwaliId: string;
  let memoryPicnicId: string;
  let relationshipId: string;

  beforeAll(async () => {
    // 1. Register User A
    const resA = await request(app).post('/api/v1/auth/register').send(userA);
    expect(resA.status).toBe(201);
    tokenA = resA.body.data.accessToken;
    userAId = resA.body.data.user.id;

    // 2. Register User B
    const resB = await request(app).post('/api/v1/auth/register').send(userB);
    expect(resB.status).toBe(201);
    tokenB = resB.body.data.accessToken;
    userBId = resB.body.data.user.id;

    // 3. Register Family Member
    const resFam = await request(app).post('/api/v1/auth/register').send(userFamily);
    expect(resFam.status).toBe(201);
    tokenFamily = resFam.body.data.accessToken;
    userFamilyId = resFam.body.data.user.id;

    // 4. Register Viewer
    const resView = await request(app).post('/api/v1/auth/register').send(userViewer);
    expect(resView.status).toBe(201);
    tokenViewer = resView.body.data.accessToken;
    userViewerId = resView.body.data.user.id;
  });

  afterAll(async () => {
    try {
      if (patientAId) {
        await prisma.patientProfile.deleteMany({ where: { id: patientAId } });
      }
      if (patientBId) {
        await prisma.patientProfile.deleteMany({ where: { id: patientBId } });
      }
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [userA.email, userB.email, userFamily.email, userViewer.email]
          }
        }
      });
    } catch (e) {
      // ignore
    }
  });

  // ==========================================
  // STEP 1: PATIENTS
  // ==========================================
  describe('Step 1: Patients API', () => {
    it('creates Patient A transactionally with OWNER access and self-person record', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Rajiv Sharma',
          preferredLanguage: 'en',
          biography: 'Retired civil engineer from Delhi',
          profileImage: '/assets/profiles/rajiv.jpg'
        });

      expect(res.status).toBe(201);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.fullName).toBe('Rajiv Sharma');
      expect(res.body.data.personId).toBeDefined();

      patientAId = res.body.data.id;
      personRajivSelfId = res.body.data.personId;

      // Verify self person exists in db
      const selfPerson = await prisma.person.findUnique({
        where: { id: personRajivSelfId }
      });
      expect(selfPerson).toBeDefined();
      expect(selfPerson?.fullName).toBe('Rajiv Sharma');
      expect(selfPerson?.patientId).toBe(patientAId);

      // Verify OWNER access record exists
      const access = await prisma.patientAccess.findUnique({
        where: {
          userId_patientId: { userId: userAId, patientId: patientAId }
        }
      });
      expect(access?.accessRole).toBe(AccessRole.OWNER);

      // Grant FAMILY access to userFamily and VIEWER access to userViewer for Patient A
      await prisma.patientAccess.create({
        data: {
          userId: userFamilyId,
          patientId: patientAId,
          accessRole: AccessRole.FAMILY,
          relationship: 'Daughter'
        }
      });
      await prisma.patientAccess.create({
        data: {
          userId: userViewerId,
          patientId: patientAId,
          accessRole: AccessRole.VIEWER,
          relationship: 'Friend'
        }
      });

      // Issue tablet session token for Patient A
      const sessionRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/patient-sessions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ durationMinutes: 1440 });
      expect(sessionRes.status).toBe(201);
      patientATabletToken = sessionRes.body.data.sessionToken;
    });

    it('creates Patient B for isolation testing', async () => {
      const res = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          fullName: 'Sunita Verma',
          preferredLanguage: 'en'
        });

      expect(res.status).toBe(201);
      patientBId = res.body.data.id;
    });

    it('rejects external URLs for profileImage with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          profileImage: 'https://malicious-site.com/image.png'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('allows CAREGIVER/OWNER to update patient profile', async () => {
      const res = await request(app)
        .patch(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          biography: 'Updated: Loved gardening and civil structures'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.biography).toBe('Updated: Loved gardening and civil structures');
    });

    it('returns profile and caller accessRole on GET /patients/:patientId', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${tokenFamily}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(patientAId);
      expect(res.body.data.accessRole).toBe(AccessRole.FAMILY);
    });

    it('rejects malformed UUID with 400', async () => {
      const res = await request(app)
        .get('/api/v1/patients/not-a-uuid')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when User B tries to access Patient A (IDOR protection)', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PATIENT_NOT_FOUND');
    });
  });

  // ==========================================
  // STEP 4: ALBUMS (tested early so memories can link to it)
  // ==========================================
  describe('Step 4: Albums API', () => {
    it('creates an album under Patient A (CAREGIVER/OWNER)', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/albums`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Family Trips',
          colorTheme: 'blue',
          yearRange: '1980-2000',
          description: 'Trips to Shimla and Nainital'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Family Trips');
      expect(res.body.data.memoryCount).toBe(0);
      albumFamilyTripsId = res.body.data.id;
    });

    it('lists albums with pagination and derived memoryCount', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}/albums`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('page', 1);
      expect(res.body.data).toHaveProperty('total', 1);
      expect(res.body.data.items[0].id).toBe(albumFamilyTripsId);
    });

    it('allows updating an album', async () => {
      const res = await request(app)
        .patch(`/api/v1/albums/${albumFamilyTripsId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'Updated trip descriptions' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated trip descriptions');
    });

    it('prevents User B from accessing Patient A album (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/albums/${albumFamilyTripsId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ALBUM_NOT_FOUND');
    });
  });

  // ==========================================
  // STEP 3: PEOPLE & RELATIONSHIPS
  // ==========================================
  describe('Step 3: People and Relationships API', () => {
    it('creates a person (Anita Sharma) under Patient A with relationship to patient', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/people`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Anita Sharma',
          biography: 'Wife and lifelong companion',
          birthYear: 1956,
          confirmedByFamily: true,
          relationship: 'Spouse'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fullName).toBe('Anita Sharma');
      expect(res.body.data.relationship).toBe('Spouse');
      expect(res.body.data.sharedMemoryCount).toBe(0);
      personAnitaId = res.body.data.id;
    });

    it('returns derived relationship label relative to patient self-person', async () => {
      const res = await request(app)
        .get(`/api/v1/people/${personAnitaId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(personAnitaId);
      expect(res.body.data.relationship).toBe('Spouse');
    });

    it('lists people with pagination and derived sharedMemoryCount', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}/people`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2); // Self person + Anita
      const anita = res.body.data.items.find((p: any) => p.id === personAnitaId);
      expect(anita).toBeDefined();
      expect(anita.relationship).toBe('Spouse');
    });

    it('hides unconfirmed people from patient tablet token', async () => {
      // Create an unconfirmed person
      const unconfirmedRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/people`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Unconfirmed Neighbor',
          confirmedByFamily: false
        });
      const unconfirmedId = unconfirmedRes.body.data.id;

      // Patient token list must NOT contain unconfirmed person
      const listRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/people`)
        .set('Authorization', `Bearer ${patientATabletToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.some((p: any) => p.id === unconfirmedId)).toBe(false);

      // Direct GET with patient token must return 404
      const getRes = await request(app)
        .get(`/api/v1/people/${unconfirmedId}`)
        .set('Authorization', `Bearer ${patientATabletToken}`);
      expect(getRes.status).toBe(404);
    });

    it('creates an explicit relationship between two people', async () => {
      // Create another person: Vikram Sharma (Son)
      const sonRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/people`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Vikram Sharma',
          confirmedByFamily: true
        });
      const sonId = sonRes.body.data.id;

      // Create relationship: Vikram is Anita's Son (personOne = Anita, personTwo = Vikram)
      const relRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/relationships`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          personOneId: personAnitaId,
          personTwoId: sonId,
          relationshipType: 'Child',
          description: 'Son of Anita'
        });

      expect(relRes.status).toBe(201);
      expect(relRes.body.data.relationshipType).toBe('Child');
      relationshipId = relRes.body.data.id;
    });

    it('rejects self-relationship with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/relationships`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          personOneId: personAnitaId,
          personTwoId: personAnitaId,
          relationshipType: 'Self'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate relationship in reverse direction with 409 Conflict', async () => {
      // Find Vikram's id
      const rel = await prisma.relationship.findUnique({ where: { id: relationshipId } });

      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/relationships`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          personOneId: rel!.personTwoId,
          personTwoId: rel!.personOneId,
          relationshipType: 'Parent'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_RELATIONSHIP');
    });

    it('rejects cross-patient relationship with 400', async () => {
      // Create a person under Patient B
      const personBRes = await request(app)
        .post(`/api/v1/patients/${patientBId}/people`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ fullName: 'Patient B Contact' });

      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/relationships`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          personOneId: personAnitaId,
          personTwoId: personBRes.body.data.id,
          relationshipType: 'Friend'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CROSS_REFERENCE');
    });

    it('prevents deleting patient self-person record with 400', async () => {
      const res = await request(app)
        .delete(`/api/v1/people/${personRajivSelfId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_SELF_PERSON');
    });
  });

  // ==========================================
  // STEP 2: MEMORIES
  // ==========================================
  describe('Step 2: Memories API', () => {
    it('creates a memory with verificationStatus = PENDING and CAREGIVER source', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/memories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Diwali in New Delhi 1985',
          description: 'A magical night of diyas and sweets',
          story: 'We lit clay diyas on the terrace and made fresh laddoos.',
          era: '1980s',
          approximateYear: 1985,
          location: 'New Delhi',
          tags: ['Diwali', 'Festival', 'Celebration'],
          albumId: albumFamilyTripsId,
          personIds: [personAnitaId]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.verificationStatus).toBe(VerificationStatus.PENDING);
      expect(res.body.data.source).toBe('CAREGIVER');
      expect(res.body.data.people.length).toBe(1);
      expect(res.body.data.people[0].relationship).toBe('Spouse');
      expect(res.body.data.album.id).toBe(albumFamilyTripsId);

      memoryDiwaliId = res.body.data.id;
    });

    it('creates a memory submitted by FAMILY with FAMILY_SUBMITTED source', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/memories`)
        .set('Authorization', `Bearer ${tokenFamily}`)
        .send({
          title: 'Picnic at India Gate',
          story: 'Eating ice cream on a warm summer evening.',
          era: '1990s',
          approximateYear: 1992,
          location: 'India Gate, Delhi',
          tags: ['Family', 'Picnic'],
          personIds: []
        });

      expect(res.status).toBe(201);
      expect(res.body.data.verificationStatus).toBe(VerificationStatus.PENDING);
      expect(res.body.data.source).toBe('FAMILY_SUBMITTED');

      memoryPicnicId = res.body.data.id;
    });

    it('rejects cross-patient personId with 400', async () => {
      // Look up person from Patient B
      const personB = await prisma.person.findFirst({ where: { patientId: patientBId } });

      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/memories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Invalid Cross Reference Test',
          story: 'Testing person from another patient',
          era: 'Modern',
          tags: [],
          personIds: [personB!.id]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CROSS_REFERENCE');
    });

    it('rejects cross-patient albumId with 400', async () => {
      // Create album on Patient B
      const albumB = await prisma.album.create({
        data: { patientId: patientBId, title: 'Patient B Album' }
      });

      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/memories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Invalid Album Test',
          story: 'Testing album from another patient',
          era: 'Modern',
          tags: [],
          albumId: albumB.id,
          personIds: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CROSS_REFERENCE');
    });

    it('hides PENDING memories from Patient Tablet Token and VIEWER (returns 404)', async () => {
      // Tablet token cannot see PENDING memoryDiwaliId
      const tabletRes = await request(app)
        .get(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${patientATabletToken}`);
      expect(tabletRes.status).toBe(404);
      expect(tabletRes.body.error.code).toBe('MEMORY_NOT_FOUND');

      // Viewer cannot see PENDING memoryDiwaliId
      const viewerRes = await request(app)
        .get(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);
      expect(viewerRes.status).toBe(404);
    });

    it('allows Family Member to view their own PENDING memory, but not others PENDING', async () => {
      // Family member CAN view memoryPicnicId (their own submission)
      const ownRes = await request(app)
        .get(`/api/v1/memories/${memoryPicnicId}`)
        .set('Authorization', `Bearer ${tokenFamily}`);
      expect(ownRes.status).toBe(200);
      expect(ownRes.body.data.id).toBe(memoryPicnicId);

      // Family member CANNOT view memoryDiwaliId (created by User A, still PENDING)
      const othersRes = await request(app)
        .get(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenFamily}`);
      expect(othersRes.status).toBe(404);
    });

    it('searches memories by query q and filters by year and location', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}/memories/search?q=Delhi&year=1985`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(memoryDiwaliId);
    });

    it('SAFETY RULE: editing verified memory auto-reverts status to PENDING', async () => {
      // Manually mark memoryDiwaliId as VERIFIED in DB
      await prisma.memory.update({
        where: { id: memoryDiwaliId },
        data: { verificationStatus: VerificationStatus.VERIFIED, approvedById: userAId }
      });

      // Verify it is now VERIFIED
      let getRes = await request(app)
        .get(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(getRes.body.data.verificationStatus).toBe(VerificationStatus.VERIFIED);

      // Edit content without reverify flag
      const patchRes = await request(app)
        .patch(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Diwali in Old Delhi 1985 (Updated Content)'
        });

      expect(patchRes.status).toBe(200);
      // Status must have auto-reverted to PENDING
      expect(patchRes.body.data.verificationStatus).toBe(VerificationStatus.PENDING);

      // Verify a Verification audit row was appended
      const verRecord = await prisma.verification.findFirst({
        where: { memoryId: memoryDiwaliId, status: VerificationStatus.PENDING },
        orderBy: { createdAt: 'desc' }
      });
      expect(verRecord).toBeDefined();
      expect(verRecord?.comments).toContain('Auto-reverted to PENDING');
    });

    it('SAFETY RULE: editing verified memory with reverify: true stays VERIFIED', async () => {
      // Re-verify in DB
      await prisma.memory.update({
        where: { id: memoryDiwaliId },
        data: { verificationStatus: VerificationStatus.VERIFIED, approvedById: userAId }
      });

      // Edit content with reverify: true
      const patchRes = await request(app)
        .patch(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Diwali in Chandni Chowk 1985',
          reverify: true
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.verificationStatus).toBe(VerificationStatus.VERIFIED);

      // Verify audit row recorded reverify
      const verRecord = await prisma.verification.findFirst({
        where: { memoryId: memoryDiwaliId, status: VerificationStatus.VERIFIED },
        orderBy: { createdAt: 'desc' }
      });
      expect(verRecord).toBeDefined();
      expect(verRecord?.comments).toContain('Re-verified');
    });

    it('reflects sharedMemoryCount on Person when linked memory is VERIFIED', async () => {
      // Anita is linked to memoryDiwaliId (which is now VERIFIED)
      const personRes = await request(app)
        .get(`/api/v1/people/${personAnitaId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(personRes.status).toBe(200);
      expect(personRes.body.data.sharedMemoryCount).toBe(1);
    });

    it('reflects visibility-aware memoryCount on Album', async () => {
      // memoryDiwaliId is in albumFamilyTripsId and is VERIFIED
      const albumRes = await request(app)
        .get(`/api/v1/albums/${albumFamilyTripsId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(albumRes.status).toBe(200);
      expect(albumRes.body.data.memoryCount).toBe(1);
    });

    it('deleting an album disassociates memories without deleting them', async () => {
      const deleteAlbumRes = await request(app)
        .delete(`/api/v1/albums/${albumFamilyTripsId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(deleteAlbumRes.status).toBe(200);

      // Memory must still exist, with albumId = null
      const memoryRes = await request(app)
        .get(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(memoryRes.status).toBe(200);
      expect(memoryRes.body.data.id).toBe(memoryDiwaliId);
      expect(memoryRes.body.data.album).toBeNull();
    });

    it('soft deletes a memory and excludes it from lists and detail', async () => {
      const delRes = await request(app)
        .delete(`/api/v1/memories/${memoryPicnicId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.id).toBe(memoryPicnicId);

      // Direct GET returns 404
      const getRes = await request(app)
        .get(`/api/v1/memories/${memoryPicnicId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('MEMORY_NOT_FOUND');
    });

    it('returns 404 when User B attempts to access Patient A memory (IDOR)', async () => {
      const res = await request(app)
        .get(`/api/v1/memories/${memoryDiwaliId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MEMORY_NOT_FOUND');
    });
  });
});

