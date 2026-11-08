import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { VerificationStatus, AccessRole, RoutinePeriod, RoutineCategory } from '@prisma/client';

describe('Phase 5 Steps 6-9 Backend APIs (Storybooks, Verification, Routine, Diary, Dashboard, Companion)', () => {
  const app = createApp();

  const userA = {
    email: `caregiver_step69_a_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Caregiver A',
    role: 'CAREGIVER'
  };

  const userB = {
    email: `caregiver_step69_b_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Caregiver B',
    role: 'CAREGIVER'
  };

  const userFamily = {
    email: `family_step69_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Family Member',
    role: 'FAMILY_MEMBER'
  };

  let tokenA: string;
  let userAId: string;
  let tokenB: string;
  let userBId: string;
  let tokenFamily: string;
  let userFamilyId: string;

  let patientAId: string;
  let patientBId: string;
  let patientATabletToken: string;

  let memoryVerified1Id: string;
  let memoryVerified2Id: string;
  let memoryPendingId: string;
  let memoryPatientBId: string;

  let personAnitaId: string;
  let albumFamilyId: string;
  let storybookId: string;
  let routineItemId: string;
  let diaryId: string;

  beforeAll(async () => {
    // 1. Register users
    const resA = await request(app).post('/api/v1/auth/register').send(userA);
    tokenA = resA.body.data.accessToken;
    userAId = resA.body.data.user.id;

    const resB = await request(app).post('/api/v1/auth/register').send(userB);
    tokenB = resB.body.data.accessToken;
    userBId = resB.body.data.user.id;

    const resFam = await request(app).post('/api/v1/auth/register').send(userFamily);
    tokenFamily = resFam.body.data.accessToken;
    userFamilyId = resFam.body.data.user.id;

    // 2. Create Patient A
    const patARes = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        fullName: 'Rajiv Malhotra',
        relationship: 'Primary Caregiver',
        biography: 'Retired professor'
      });
    patientAId = patARes.body.data.id;

    // Grant FAMILY access to userFamily
    await prisma.patientAccess.create({
      data: {
        userId: userFamilyId,
        patientId: patientAId,
        accessRole: AccessRole.FAMILY,
        relationship: 'Son'
      }
    });

    // Issue tablet token for Patient A
    const sessionRes = await request(app)
      .post(`/api/v1/patients/${patientAId}/patient-sessions`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ durationMinutes: 1440 });
    patientATabletToken = sessionRes.body.data.sessionToken;

    // 3. Create Patient B
    const patBRes = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        fullName: 'Meera Sen',
        relationship: 'Primary Caregiver'
      });
    patientBId = patBRes.body.data.id;

    // 4. Create Person (Anita) under Patient A
    const personRes = await request(app)
      .post(`/api/v1/patients/${patientAId}/people`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        fullName: 'Anita Malhotra',
        relationship: 'Spouse',
        confirmedByFamily: true
      });
    personAnitaId = personRes.body.data.id;

    // 5. Create Album under Patient A
    const albumRes = await request(app)
      .post(`/api/v1/patients/${patientAId}/albums`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'College Days',
        colorTheme: 'amber'
      });
    albumFamilyId = albumRes.body.data.id;

    // 6. Create Memories on Patient A: 2 verified, 1 pending
    const mem1Res = await request(app)
      .post(`/api/v1/patients/${patientAId}/memories`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Graduation Ceremony 1970',
        story: 'Receiving the gold medal in civil engineering.',
        era: '1970s',
        approximateYear: 1970,
        tags: ['College', 'Graduation'],
        albumId: albumFamilyId,
        personIds: [personAnitaId]
      });
    memoryVerified1Id = mem1Res.body.data.id;
    await prisma.memory.update({
      where: { id: memoryVerified1Id },
      data: { verificationStatus: VerificationStatus.VERIFIED, approvedById: userAId }
    });

    const mem2Res = await request(app)
      .post(`/api/v1/patients/${patientAId}/memories`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Wedding in Jaipur 1975',
        story: 'A beautiful traditional ceremony in Jaipur.',
        era: '1970s',
        approximateYear: 1975,
        location: 'Jaipur',
        tags: ['Wedding', 'Family'],
        personIds: [personAnitaId]
      });
    memoryVerified2Id = mem2Res.body.data.id;
    await prisma.memory.update({
      where: { id: memoryVerified2Id },
      data: { verificationStatus: VerificationStatus.VERIFIED, approvedById: userAId }
    });

    const mem3Res = await request(app)
      .post(`/api/v1/patients/${patientAId}/memories`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Unverified Family Picnic',
        story: 'A sunny afternoon picnic with cousins.',
        era: '1980s',
        tags: ['Picnic'],
        personIds: []
      });
    memoryPendingId = mem3Res.body.data.id;

    // 7. Create Memory on Patient B
    const memBRes = await request(app)
      .post(`/api/v1/patients/${patientBId}/memories`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Patient B Memory',
        story: 'Memory belonging to Patient B.',
        era: '1990s',
        tags: []
      });
    memoryPatientBId = memBRes.body.data.id;
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
          email: { in: [userA.email, userB.email, userFamily.email] }
        }
      });
    } catch (e) {
      // ignore
    }
  });

  // ==========================================
  // STEP 6: STORYBOOKS
  // ==========================================
  describe('Step 6: Storybooks API', () => {
    it('creates a storybook with initial ordered memories', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/storybooks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'The Early Years',
          description: 'Cherished memories of college and wedding',
          memoryIds: [memoryVerified1Id, memoryVerified2Id]
        });

      expect(res.status).toBe(201);
      expect(res.body.error).toBeNull();
      expect(res.body.data.title).toBe('The Early Years');
      expect(res.body.data.memories.length).toBe(2);
      expect(res.body.data.memories[0].sequenceOrder).toBe(1);
      expect(res.body.data.memories[0].memory.id).toBe(memoryVerified1Id);
      expect(res.body.data.memories[1].sequenceOrder).toBe(2);
      expect(res.body.data.memories[1].memory.id).toBe(memoryVerified2Id);

      storybookId = res.body.data.id;
    });

    it('rejects adding a memory belonging to another patient with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/storybooks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Cross Patient Storybook',
          memoryIds: [memoryPatientBId]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CROSS_REFERENCE');
    });

    it('only returns VERIFIED memories in storybook for Patient Tablet Token', async () => {
      // Add a pending memory to the storybook using CAREGIVER
      await request(app)
        .post(`/api/v1/storybooks/${storybookId}/memories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ memoryId: memoryPendingId });

      // View with Caregiver: all 3 memories appear
      const caregiverRes = await request(app)
        .get(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(caregiverRes.status).toBe(200);
      expect(caregiverRes.body.data.memories.length).toBe(3);

      // View with Tablet Token: only the 2 VERIFIED memories appear
      const tabletRes = await request(app)
        .get(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${patientATabletToken}`);
      expect(tabletRes.status).toBe(200);
      expect(tabletRes.body.data.memories.length).toBe(2);
      expect(tabletRes.body.data.memories.some((m: any) => m.memory.id === memoryPendingId)).toBe(false);
    });

    it('reorders storybook memories transactionally without unique constraint violation', async () => {
      // Reverse order: memoryVerified2Id first, then memoryVerified1Id
      const reorderRes = await request(app)
        .post(`/api/v1/storybooks/${storybookId}/memories`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          memoryIds: [memoryVerified2Id, memoryVerified1Id]
        });

      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.data.memories[0].memory.id).toBe(memoryVerified2Id);
      expect(reorderRes.body.data.memories[0].sequenceOrder).toBe(1);
      expect(reorderRes.body.data.memories[1].memory.id).toBe(memoryVerified1Id);
      expect(reorderRes.body.data.memories[1].sequenceOrder).toBe(2);
    });

    it('removes a memory from storybook and maintains contiguous sequenceOrder', async () => {
      const delMemRes = await request(app)
        .delete(`/api/v1/storybooks/${storybookId}/memories/${memoryVerified2Id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delMemRes.status).toBe(200);

      // Verify remaining memories are contiguous
      const checkRes = await request(app)
        .get(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.memories.length).toBe(1);
      expect(checkRes.body.data.memories[0].sequenceOrder).toBe(1);
      expect(checkRes.body.data.memories[0].memory.id).toBe(memoryVerified1Id);
    });

    it('allows updating storybook metadata', async () => {
      const patchRes = await request(app)
        .patch(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'The College Journey (Updated)' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.title).toBe('The College Journey (Updated)');
    });

    it('prevents User B from accessing Patient A storybook (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('STORYBOOK_NOT_FOUND');
    });

    it('soft deletes storybook and excludes it from reads', async () => {
      const delRes = await request(app)
        .delete(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/storybooks/${storybookId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('STORYBOOK_NOT_FOUND');
    });
  });

  // ==========================================
  // STEP 7: VERIFICATION (FAMILY APPROVAL)
  // ==========================================
  describe('Step 7: Verification API', () => {
    it('lists memories awaiting family review in the verification queue', async () => {
      const queueRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/verifications/queue`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(queueRes.status).toBe(200);
      expect(queueRes.body.data).toHaveProperty('items');
      const pendingMem = queueRes.body.data.items.find((m: any) => m.id === memoryPendingId);
      expect(pendingMem).toBeDefined();
    });

    it('approves a memory transactionally (status -> VERIFIED, approvedById set, Verification row written)', async () => {
      const verifyRes = await request(app)
        .post(`/api/v1/memories/${memoryPendingId}/verify`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          comments: 'Confirmed by daughter with family photo album'
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(verifyRes.body.data.approvedById).toBe(userAId);
      expect(verifyRes.body.data.verificationRecord.status).toBe(VerificationStatus.VERIFIED);
      expect(verifyRes.body.data.verificationRecord.comments).toBe('Confirmed by daughter with family photo album');

      // Verify row exists in DB
      const verRow = await prisma.verification.findFirst({
        where: { memoryId: memoryPendingId, status: VerificationStatus.VERIFIED }
      });
      expect(verRow).toBeDefined();
    });

    it('rejects a memory transactionally (status -> REJECTED, approvedById cleared, Verification row written)', async () => {
      const rejectRes = await request(app)
        .post(`/api/v1/memories/${memoryPendingId}/reject`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          comments: 'Incorrect date and location details'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.verificationStatus).toBe(VerificationStatus.REJECTED);
      expect(rejectRes.body.data.approvedById).toBeNull();
      expect(rejectRes.body.data.verificationRecord.status).toBe(VerificationStatus.REJECTED);
    });

    it('retrieves the complete verification audit trail for patient', async () => {
      const auditRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/verifications`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(auditRes.body.data.items[0]).toHaveProperty('verifier');
      expect(auditRes.body.data.items[0].verifier).toHaveProperty('name', 'Caregiver A');
    });

    it('prevents FAMILY role from verifying memories (CAREGIVER/OWNER only)', async () => {
      const res = await request(app)
        .post(`/api/v1/memories/${memoryPendingId}/verify`)
        .set('Authorization', `Bearer ${tokenFamily}`)
        .send({ comments: 'Family member attempt' });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // STEP 8: ROUTINE, DIARY, DASHBOARD, GRAPH
  // ==========================================
  describe('Step 8: Routine, Diary, Dashboard, Graph API', () => {
    // --- Routine ---
    it('creates a routine item validating 24h format and exposes displayTime', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/routine`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Morning Blood Pressure Medicine',
          scheduledTime: '08:30',
          period: RoutinePeriod.MORNING,
          category: RoutineCategory.MEDICATION,
          notes: 'Take with warm water'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.scheduledTime).toBe('08:30');
      expect(res.body.data.displayTime).toBe('08:30 AM');
      expect(res.body.data.completed).toBe(false);

      routineItemId = res.body.data.id;
    });

    it('rejects invalid time format with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/routine`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Invalid Time Routine',
          scheduledTime: '25:99',
          period: RoutinePeriod.MORNING,
          category: RoutineCategory.ACTIVITY
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('allows patient tablet token to mark routine item completed', async () => {
      const res = await request(app)
        .patch(`/api/v1/routine/${routineItemId}/complete`)
        .set('Authorization', `Bearer ${patientATabletToken}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(true);
    });

    it('filters routine items by period and completion status', async () => {
      const res = await request(app)
        .get(`/api/v1/patients/${patientAId}/routine?period=MORNING&completed=true`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].id).toBe(routineItemId);
    });

    // --- Diary ---
    it('creates or upserts a daily diary recap entry', async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .post(`/api/v1/patients/${patientAId}/diary`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          date: todayIso,
          weather: 'Pleasant & Sunny',
          greeting: 'Good Evening Rajiv',
          morningNote: 'Enjoyed breakfast and morning walk in the garden.',
          afternoonNote: 'Looked at old photo albums with Anita.',
          eveningNote: 'Listened to classical ragas before dinner.',
          caregiverSign: 'Nurse Anjali'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.weather).toBe('Pleasant & Sunny');
      expect(res.body.data.caregiverSign).toBe('Nurse Anjali');
      expect(res.body.data.audioUrl).toBeNull();
      expect(res.body.data.text).toContain('morning walk');

      diaryId = res.body.data.id;
    });

    it('retrieves diary list and individual diary entry', async () => {
      const listRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/diary`)
        .set('Authorization', `Bearer ${patientATabletToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);

      const getRes = await request(app)
        .get(`/api/v1/diary/${diaryId}`)
        .set('Authorization', `Bearer ${patientATabletToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(diaryId);
    });

    // --- Dashboard ---
    it('returns aggregated dashboard metrics without leaking unverified data to tablet token', async () => {
      // Query with Caregiver
      const caregiverDash = await request(app)
        .get(`/api/v1/patients/${patientAId}/dashboard`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(caregiverDash.status).toBe(200);
      expect(caregiverDash.body.data.patient.fullName).toBe('Rajiv Malhotra');
      expect(caregiverDash.body.data.stats).toHaveProperty('totalMemories');
      expect(caregiverDash.body.data.stats).toHaveProperty('verifiedMemories');
      expect(caregiverDash.body.data.stats).toHaveProperty('totalPeople');

      // Query with Tablet Token: totalMemories must only count VERIFIED memories
      const tabletDash = await request(app)
        .get(`/api/v1/patients/${patientAId}/dashboard`)
        .set('Authorization', `Bearer ${patientATabletToken}`);

      expect(tabletDash.status).toBe(200);
      expect(tabletDash.body.data.stats.totalMemories).toBe(tabletDash.body.data.stats.verifiedMemories);
    });

    // --- Graph ---
    it('returns nodes and links excluding soft-deleted and unverified entities for tablet token', async () => {
      const graphRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/graph`)
        .set('Authorization', `Bearer ${patientATabletToken}`);

      expect(graphRes.status).toBe(200);
      expect(graphRes.body.data).toHaveProperty('nodes');
      expect(graphRes.body.data).toHaveProperty('links');

      const nodes = graphRes.body.data.nodes;
      // Patient node must exist
      expect(nodes.some((n: any) => n.type === 'patient')).toBe(true);
      // Confirmed person Anita must exist
      expect(nodes.some((n: any) => n.id === personAnitaId)).toBe(true);
      // Verified memories must exist
      expect(nodes.some((n: any) => n.id === memoryVerified1Id)).toBe(true);
      // Unverified or rejected memory must NOT be in tablet graph
      expect(nodes.some((n: any) => n.id === memoryPendingId)).toBe(false);
    });
  });

  // ==========================================
  // STEP 9: COMPANION
  // ==========================================
  describe('Step 9: Companion API', () => {
    it('returns companion greeting and prompt state', async () => {
      const stateRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/companion/state`)
        .set('Authorization', `Bearer ${patientATabletToken}`);

      expect(stateRes.status).toBe(200);
      expect(stateRes.body.data.patientName).toBe('Rajiv Malhotra');
      expect(stateRes.body.data.firstName).toBe('Rajiv');
      expect(stateRes.body.data.mascotState).toBe('friendly');
      expect(stateRes.body.data.suggestedPrompts.length).toBeGreaterThanOrEqual(3);
      expect(stateRes.body.data.explanation).toContain('Rule-based memory companion');
    });

    it('processes conversational interaction matching verified memory and records history in database', async () => {
      const msgRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/companion/message`)
        .set('Authorization', `Bearer ${patientATabletToken}`)
        .send({
          text: 'Tell me about my graduation ceremony'
        });

      expect(msgRes.status).toBe(200);
      expect(msgRes.body.data.reply).toContain('Graduation Ceremony 1970');
      expect(msgRes.body.data.suggestedMemories.length).toBeGreaterThanOrEqual(1);
      expect(msgRes.body.data.suggestedMemories[0].id).toBe(memoryVerified1Id);

      // Verify conversation and message rows were recorded in database
      const conversation = await prisma.conversation.findFirst({
        where: { patientId: patientAId },
        include: { messages: true }
      });
      expect(conversation).toBeDefined();
      expect(conversation?.messages.some((m) => m.senderType === 'USER')).toBe(true);
      expect(conversation?.messages.some((m) => m.senderType === 'COMPANION')).toBe(true);
    });

    it('processes routine intent query and returns suggested upcoming routine items', async () => {
      // Create an uncompleted routine item for medicine
      await prisma.routineItem.create({
        data: {
          patientId: patientAId,
          createdBy: userAId,
          title: 'Evening Calcium Pill',
          scheduledTime: '20:00',
          period: RoutinePeriod.EVENING,
          category: RoutineCategory.MEDICATION,
          completed: false
        }
      });

      const msgRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/companion/message`)
        .set('Authorization', `Bearer ${patientATabletToken}`)
        .send({
          text: 'What medicine do I need to take?'
        });

      expect(msgRes.status).toBe(200);
      expect(msgRes.body.data.suggestedRoutine.length).toBeGreaterThanOrEqual(1);
      expect(msgRes.body.data.reply).toContain('Evening Calcium Pill');
    });

    it('returns gentle reassurance fallback when query does not match specific memory', async () => {
      const msgRes = await request(app)
        .post(`/api/v1/patients/${patientAId}/companion/message`)
        .set('Authorization', `Bearer ${patientATabletToken}`)
        .send({
          text: 'Hello, how is the weather today?'
        });

      expect(msgRes.status).toBe(200);
      expect(msgRes.body.data.reply).toContain('Rajiv');
    });
  });

  // ==========================================
  // IDOR & VALIDATION ACROSS STEPS 6-9
  // ==========================================
  describe('IDOR & Validation Matrix across Steps 6-9', () => {
    it('rejects malformed UUID with 400 across new endpoints', async () => {
      const sbRes = await request(app)
        .get('/api/v1/storybooks/not-a-uuid')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(sbRes.status).toBe(400);

      const routRes = await request(app)
        .get('/api/v1/routine/not-a-uuid')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(routRes.status).toBe(400);

      const diaryRes = await request(app)
        .get('/api/v1/diary/not-a-uuid')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(diaryRes.status).toBe(400);
    });

    it('returns 404 when User B tries to access Patient A resources (IDOR)', async () => {
      const routRes = await request(app)
        .get(`/api/v1/routine/${routineItemId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(routRes.status).toBe(404);

      const diaryRes = await request(app)
        .get(`/api/v1/diary/${diaryId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(diaryRes.status).toBe(404);

      const dashRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/dashboard`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(dashRes.status).toBe(404);

      const compRes = await request(app)
        .get(`/api/v1/patients/${patientAId}/companion/state`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(compRes.status).toBe(404);
    });
  });
});

