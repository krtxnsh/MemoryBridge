import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Family workspace invitations', () => {
  const app = createApp();
  const runId = Date.now();
  const ownerEmail = `invite_owner_${runId}@example.com`;
  const memberEmail = `invite_member_${runId}@example.com`;
  const secondMemberEmail = `invite_member_two_${runId}@example.com`;

  let ownerToken: string;
  let memberToken: string;
  let secondMemberToken: string;
  let patientId: string;
  let invitationId: string;
  let invitationCode: string;

  beforeAll(async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      email: ownerEmail,
      password: 'Password123!',
      name: 'Invitation Owner',
      role: 'CAREGIVER'
    });
    ownerToken = owner.body.data.accessToken;

    const member = await request(app).post('/api/v1/auth/register').send({
      email: memberEmail,
      password: 'Password123!',
      name: 'Invited Member',
      role: 'FAMILY_MEMBER'
    });
    memberToken = member.body.data.accessToken;

    const secondMember = await request(app).post('/api/v1/auth/register').send({
      email: secondMemberEmail,
      password: 'Password123!',
      name: 'Second Member',
      role: 'FAMILY_MEMBER'
    });
    secondMemberToken = secondMember.body.data.accessToken;

    const patient = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fullName: 'Family Workspace Patient', relationship: 'Primary Caregiver' });
    patientId = patient.body.data.id;
  });

  afterAll(async () => {
    if (patientId) {
      await prisma.patientProfile.deleteMany({ where: { id: patientId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, memberEmail, secondMemberEmail] } }
    });
  });

  it('prevents a user without caregiver access from creating an invitation', async () => {
    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/invitations`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ relationship: 'Daughter', accessRole: 'FAMILY' });

    expect(response.status).toBe(404);
  });

  it('allows an owner to create a short-lived family invitation', async () => {
    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ relationship: 'Daughter', accessRole: 'FAMILY', expiresInHours: 24 });

    expect(response.status).toBe(201);
    expect(response.body.data.code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    expect(response.body.data).not.toHaveProperty('codeHash');
    expect(response.body.data.accessRole).toBe('FAMILY');
    invitationId = response.body.data.id;
    invitationCode = response.body.data.code;
  });

  it('does not expose invitation code hashes when listing invitations', async () => {
    const response = await request(app)
      .get(`/api/v1/patients/${patientId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.some((item: any) => item.id === invitationId)).toBe(true);
    expect(response.body.data[0]).not.toHaveProperty('code');
    expect(response.body.data[0]).not.toHaveProperty('codeHash');
  });

  it('redeems an invitation once and grants patient access', async () => {
    const redeem = await request(app)
      .post('/api/v1/invitations/redeem')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ code: invitationCode.toLowerCase() });

    expect(redeem.status).toBe(200);
    expect(redeem.body.data.patient.id).toBe(patientId);
    expect(redeem.body.data.accessRole).toBe('FAMILY');

    const patients = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(patients.body.data.some((patient: any) => patient.id === patientId)).toBe(true);

    const member = await prisma.user.findUniqueOrThrow({ where: { email: memberEmail } });
    const access = await prisma.patientAccess.findUnique({
      where: { userId_patientId: { userId: member.id, patientId } }
    });
    expect(access?.accessRole).toBe('FAMILY');
    expect(access?.relationship).toBe('Daughter');
  });

  it('rejects reuse of a redeemed invitation', async () => {
    const response = await request(app)
      .post('/api/v1/invitations/redeem')
      .set('Authorization', `Bearer ${secondMemberToken}`)
      .send({ code: invitationCode });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INVITATION');
  });

  it('records invitation creation and redemption in the patient audit log', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        patientId,
        action: { in: ['CREATE_FAMILY_INVITATION', 'REDEEM_FAMILY_INVITATION'] }
      }
    });

    expect(logs.some((log) => log.action === 'CREATE_FAMILY_INVITATION')).toBe(true);
    expect(logs.some((log) => log.action === 'REDEEM_FAMILY_INVITATION')).toBe(true);
  });
});
