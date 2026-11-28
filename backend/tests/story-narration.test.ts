import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { resetLlmProvider } from '../src/services/llm/index.js';
import { MockLlmProvider } from '../src/services/llm/mock.provider.js';

const SAFE_FALLBACK =
  "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";

describe('Companion life-story narration & verified-memory safety', () => {
  const app = createApp();
  const caregiver = {
    email: `narration_care_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Care Giver',
    role: 'CAREGIVER'
  };

  let token: string;
  let patientId: string;
  let tabletToken: string;
  let selfPersonId: string;
  let motherPersonId: string;

  // id -> approximateYear for chronology assertions
  const year = new Map<string, number>();
  const ids: Record<string, string> = {};
  const origProvider = (env as any).LLM_PROVIDER;

  async function createMemory(body: any): Promise<string> {
    const res = await request(app)
      .post(`/api/v1/patients/${patientId}/memories`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(201);
    return res.body.data.id;
  }
  async function verify(id: string) {
    const res = await request(app)
      .post(`/api/v1/memories/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comments: 'ok' });
    expect(res.status).toBe(200);
  }
  async function addVerified(key: string, body: any): Promise<string> {
    const id = await createMemory(body);
    await verify(id);
    ids[key] = id;
    year.set(id, body.approximateYear);
    return id;
  }
  async function ask(text: string) {
    const res = await request(app)
      .post(`/api/v1/patients/${patientId}/companion/message`)
      .set('Authorization', `Bearer ${tabletToken}`)
      .send({ text });
    expect(res.status).toBe(200);
    return res.body.data;
  }

  beforeAll(async () => {
    (env as any).LLM_PROVIDER = 'mock';
    resetLlmProvider();

    token = (await request(app).post('/api/v1/auth/register').send(caregiver)).body.data.accessToken;
    patientId = (
      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullName: 'Gopal Rao', relationship: 'Primary Caregiver' })
    ).body.data.id;
    tabletToken = (
      await request(app)
        .post(`/api/v1/patients/${patientId}/patient-sessions`)
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 1440 })
    ).body.data.sessionToken;

    // self person (auto-created) + a mother
    const patient = await prisma.patientProfile.findUniqueOrThrow({ where: { id: patientId } });
    selfPersonId = patient.personId!;
    const kamala = await prisma.person.create({
      data: { patientId, fullName: 'Kamala', birthYear: 1925, biography: 'Mother', confirmedByFamily: true }
    });
    motherPersonId = kamala.id;
    await prisma.relationship.create({
      data: { patientId, personOneId: selfPersonId, personTwoId: motherPersonId, relationshipType: 'Mother', description: 'Mother' }
    });

    // Verified memories across the life (chronological), with a known place "Udupi".
    await addVerified('coffee_child', {
      title: 'Childhood Coffee with Amma', story: 'As a boy you watched your mother Kamala make filter coffee each morning in Udupi.',
      approximateYear: 1958, era: 'Childhood', eventType: 'ritual', location: 'Udupi', tags: ['coffee', 'childhood'], personIds: [motherPersonId]
    });
    await addVerified('school', {
      title: 'School Prize Day', story: 'You won the arithmetic prize at school and felt very proud.',
      approximateYear: 1965, era: 'School', eventType: 'achievement', location: 'Udupi', tags: ['school', 'prize'], personIds: []
    });
    await addVerified('wedding', {
      title: 'Wedding at Udupi', story: 'You married in a warm temple ceremony in Udupi with a banana-leaf feast.',
      approximateYear: 1975, era: 'Marriage', eventType: 'wedding', location: 'Udupi', tags: ['wedding'], personIds: [] });
    await addVerified('coffee_family', {
      title: 'Morning Coffee as a Family', story: 'In your own home you kept the morning coffee ritual, sharing the first cup by the window.',
      approximateYear: 1980, era: 'Young Family', eventType: 'ritual', location: 'Bangalore', tags: ['coffee'], personIds: [] });
    await addVerified('grandchild', {
      title: "Grandchild's First Steps", story: 'Your little grandchild took first steps into your arms in the garden.',
      approximateYear: 2010, era: 'Grandparent Years', eventType: 'family', location: 'Bangalore', tags: ['grandchild'], personIds: [] });

    // Curated link: coffee ritual across generations.
    await prisma.memoryLink.create({
      data: {
        patientId, fromMemoryId: ids['coffee_child'], toMemoryId: ids['coffee_family'],
        linkType: 'ritual', connectionNote: 'The coffee ritual your mother began, you carried into your own home.'
      }
    });

    // Negatives: a PENDING Goa trip and a REJECTED lottery memory.
    ids['pending_goa'] = await createMemory({
      title: 'A Goa Beach Trip', story: 'A draft of a Goa beach trip, awaiting family review.',
      approximateYear: 1990, era: 'Middle Life', eventType: 'travel', location: 'Goa', tags: ['Goa'], personIds: []
    });
    ids['rejected_lottery'] = await createMemory({
      title: 'Won a Lottery', story: 'A draft claiming a lottery win in Chennai.',
      approximateYear: 1992, era: 'Middle Life', eventType: 'other', location: 'Chennai', tags: ['lottery'], personIds: []
    });
    await request(app)
      .post(`/api/v1/memories/${ids['rejected_lottery']}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Did not happen' });
  });

  afterAll(async () => {
    (env as any).LLM_PROVIDER = origProvider;
    resetLlmProvider();
    vi.restoreAllMocks();
    try {
      await prisma.patientProfile.deleteMany({ where: { id: patientId } });
      await prisma.user.deleteMany({ where: { email: caregiver.email } });
    } catch {
      /* ignore */
    }
  });

  it('shows verified memories to the patient but never the PENDING or REJECTED ones', async () => {
    const res = await request(app)
      .get(`/api/v1/patients/${patientId}/memories`)
      .set('Authorization', `Bearer ${tabletToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.items.map((m: any) => m.title);
    expect(titles).toContain('Wedding at Udupi');
    expect(titles).not.toContain('A Goa Beach Trip'); // pending
    expect(titles).not.toContain('Won a Lottery'); // rejected
  });

  it('a PENDING topic (Goa) and a non-existent topic (Paris) return the exact fallback and never call the LLM', async () => {
    const spy = vi.spyOn(MockLlmProvider.prototype, 'generate');
    const goa = await ask('Tell me about my trip to Goa');
    const paris = await ask('Tell me about Paris');
    expect(goa.reply).toBe(SAFE_FALLBACK);
    expect(goa.answerSource).toBe('fallback');
    expect(paris.reply).toBe(SAFE_FALLBACK);
    expect(paris.answerSource).toBe('fallback');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('life-story narration returns memories in chronological order and includes linked memories', async () => {
    const r = await ask('Tell me my life story');
    expect(r.answerSource === 'llm' || r.answerSource === 'rule_based').toBe(true);
    expect(r.grounding.mode).toBe('narration');
    const used: string[] = r.usedMemoryIds;
    expect(used.length).toBeGreaterThanOrEqual(5);

    // chronological (non-decreasing years)
    const years = used.map((id) => year.get(id)).filter((y) => y !== undefined) as number[];
    const sorted = [...years].sort((a, b) => a - b);
    expect(years).toEqual(sorted);

    // includes the linked pair
    expect(used).toContain(ids['coffee_child']);
    expect(used).toContain(ids['coffee_family']);

    // never includes the pending/rejected memories
    expect(used).not.toContain(ids['pending_goa']);
    expect(used).not.toContain(ids['rejected_lottery']);
  });

  it('narration (mock LLM) contains only facts from the provided verified memories', async () => {
    const r = await ask('Tell me my life story');
    const reply: string = r.reply.toLowerCase();
    // a verified place/detail is present
    expect(reply).toContain('udupi');
    // nothing from the pending/rejected memories or invented places leaks in
    expect(reply).not.toContain('goa');
    expect(reply).not.toContain('lottery');
    expect(reply).not.toContain('chennai');
    expect(reply).not.toContain('paris');
  });

  it('person-scope narration ("my mother") stays grounded in verified memories', async () => {
    const r = await ask('Tell me about my mother');
    expect(r.grounding.mode).toBe('narration');
    expect(r.usedMemoryIds).toContain(ids['coffee_child']); // tagged with the mother
    expect(r.reply.toLowerCase()).toContain('kamala');
  });

  it('falls back to the deterministic template when the LLM provider fails', async () => {
    (env as any).LLM_PROVIDER = 'openai';
    (env as any).LLM_API_KEY = 'sk-test';
    (env as any).LLM_BASE_URL = 'http://127.0.0.1:1'; // connection refused
    (env as any).LLM_TIMEOUT_MS = 800;
    resetLlmProvider();

    const r = await ask('Tell me my life story');
    expect(r.answerSource).toBe('rule_based');
    expect(r.reply).toContain("Let's look back together");
    expect(r.usedMemoryIds.length).toBeGreaterThanOrEqual(5);

    (env as any).LLM_PROVIDER = 'mock';
    (env as any).LLM_API_KEY = '';
    (env as any).LLM_BASE_URL = '';
    resetLlmProvider();
  });

  it('editing a verified memory returns it to PENDING and removes it from narration', async () => {
    const before = await ask('Tell me my life story');
    expect(before.usedMemoryIds).toContain(ids['coffee_family']);

    // Edit the story -> content change reverts a VERIFIED memory to PENDING.
    const edit = await request(app)
      .patch(`/api/v1/memories/${ids['coffee_family']}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ story: 'An edited version of the family coffee ritual story.' });
    expect(edit.status).toBe(200);
    expect(edit.body.data.verificationStatus).toBe('PENDING');

    const after = await ask('Tell me my life story');
    expect(after.usedMemoryIds).not.toContain(ids['coffee_family']);
    expect(after.usedMemoryIds).toContain(ids['coffee_child']); // the other verified memory stays
  });
});
