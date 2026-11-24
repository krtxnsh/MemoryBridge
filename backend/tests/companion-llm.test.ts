import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import {
  generateGroundedReply,
  getLlmProvider,
  resetLlmProvider
} from '../src/services/llm/index.js';
import { MockLlmProvider } from '../src/services/llm/mock.provider.js';
import { OpenAiLlmProvider } from '../src/services/llm/openai.provider.js';

const SAFE_FALLBACK =
  "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";

describe('LLM grounding layer', () => {
  const originalProvider = (env as any).LLM_PROVIDER;
  const originalKey = (env as any).LLM_API_KEY;

  afterAll(() => {
    (env as any).LLM_PROVIDER = originalProvider;
    (env as any).LLM_API_KEY = originalKey;
    resetLlmProvider();
  });

  it('mock provider composes a reply ONLY from supplied facts', async () => {
    const provider = new MockLlmProvider();
    const res = await provider.generate({
      messages: [
        { role: 'system', content: 'ground only' },
        {
          role: 'user',
          content: '<patient>Rajiv</patient>\n<facts>\n- "Graduation Day" (1970): He received his degree.\n</facts>'
        }
      ],
      maxTokens: 100,
      temperature: 0.3,
      timeoutMs: 1000
    });
    expect(res.text).toContain('Rajiv');
    expect(res.text).toContain('degree');
    // It must not fabricate anything beyond the supplied fact.
    expect(res.text.toLowerCase()).not.toContain('wedding');
  });

  it('mock provider refuses (safe fallback) when there are no facts', async () => {
    const provider = new MockLlmProvider();
    const res = await provider.generate({
      messages: [{ role: 'user', content: '<patient>Rajiv</patient>\n<facts>\n</facts>' }],
      maxTokens: 100,
      temperature: 0.3,
      timeoutMs: 1000
    });
    expect(res.text).toBe(SAFE_FALLBACK);
  });

  it('generateGroundedReply never calls the LLM when there are zero facts', async () => {
    (env as any).LLM_PROVIDER = 'mock';
    resetLlmProvider();
    const out = await generateGroundedReply({ firstName: 'Rajiv', question: 'anything', facts: [] });
    expect(out).toBeNull();
  });

  it('generateGroundedReply returns grounded text when facts are present', async () => {
    (env as any).LLM_PROVIDER = 'mock';
    resetLlmProvider();
    const out = await generateGroundedReply({
      firstName: 'Rajiv',
      question: 'Tell me about my graduation',
      facts: ['"Graduation Day" (1970): He received his degree in the city hall.']
    });
    expect(out).not.toBeNull();
    expect(out?.provider).toBe('mock');
    expect(out?.text.toLowerCase()).toContain('degree');
  });

  it('a remote provider without an API key is treated as disabled', () => {
    (env as any).LLM_PROVIDER = 'openai';
    (env as any).LLM_API_KEY = '';
    resetLlmProvider();
    expect(getLlmProvider()).toBeNull();

    // And with a key it becomes available (not called here).
    (env as any).LLM_API_KEY = 'sk-test-key';
    resetLlmProvider();
    const provider = getLlmProvider();
    expect(provider).toBeInstanceOf(OpenAiLlmProvider);
    expect(provider?.configured).toBe(true);

    (env as any).LLM_PROVIDER = 'none';
    (env as any).LLM_API_KEY = '';
    resetLlmProvider();
    expect(getLlmProvider()).toBeNull();
  });

  it('openai provider aborts on timeout and raises a typed error', async () => {
    const provider = new OpenAiLlmProvider({ apiKey: 'sk-test', model: 'gpt-4o-mini', baseUrl: 'http://10.255.255.1' });
    await expect(
      provider.generate({
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 10,
        temperature: 0,
        timeoutMs: 150
      })
    ).rejects.toMatchObject({ name: 'LlmError' });
  });
});

describe('Companion grounded end-to-end (mock LLM)', () => {
  const app = createApp();
  const caregiver = {
    email: `companion_llm_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Caregiver LLM',
    role: 'CAREGIVER'
  };

  let token: string;
  let patientId: string;
  let tabletToken: string;
  let verifiedMemoryId: string;

  const originalProvider = (env as any).LLM_PROVIDER;

  beforeAll(async () => {
    (env as any).LLM_PROVIDER = 'mock';
    resetLlmProvider();

    const reg = await request(app).post('/api/v1/auth/register').send(caregiver);
    token = reg.body.data.accessToken;

    const pat = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Rajiv Verma', relationship: 'Primary Caregiver' });
    patientId = pat.body.data.id;

    const sess = await request(app)
      .post(`/api/v1/patients/${patientId}/patient-sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ durationMinutes: 1440 });
    tabletToken = sess.body.data.sessionToken;

    const mem = await request(app)
      .post(`/api/v1/patients/${patientId}/memories`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Graduation Ceremony',
        story: 'Rajiv received his engineering degree at the university hall in 1970.',
        approximateYear: 1970,
        era: '1970s',
        tags: ['graduation', 'degree', 'university']
      });
    verifiedMemoryId = mem.body.data.id;

    await request(app)
      .post(`/api/v1/memories/${verifiedMemoryId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comments: 'Confirmed by family' });
  });

  afterAll(async () => {
    (env as any).LLM_PROVIDER = originalProvider;
    resetLlmProvider();
    try {
      await prisma.patientProfile.deleteMany({ where: { id: patientId } });
      await prisma.user.deleteMany({ where: { email: caregiver.email } });
    } catch {
      /* ignore */
    }
  });

  it('phrases a verified-memory answer via the LLM and keeps provenance', async () => {
    const res = await request(app)
      .post(`/api/v1/patients/${patientId}/companion/message`)
      .set('Authorization', `Bearer ${tabletToken}`)
      .send({ text: 'Tell me about my graduation' });

    expect(res.status).toBe(200);
    expect(res.body.data.answerSource).toBe('llm');
    expect(res.body.data.grounding.source).toBe('llm');
    expect(res.body.data.grounding.usedVerifiedMemory).toBe(true);
    expect(res.body.data.grounding.supportingMemoryId).toBe(verifiedMemoryId);
    expect(res.body.data.grounding.llm.provider).toBe('mock');
    // Reply is grounded in the verified fact (degree), not invented.
    expect(res.body.data.reply.toLowerCase()).toContain('degree');
    expect(res.body.data.memoryCard.id).toBe(verifiedMemoryId);
  });

  it('returns the exact safe fallback WITHOUT invoking the LLM when nothing matches', async () => {
    const res = await request(app)
      .post(`/api/v1/patients/${patientId}/companion/message`)
      .set('Authorization', `Bearer ${tabletToken}`)
      .send({ text: 'What is the stock market doing today?' });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toBe(SAFE_FALLBACK);
    expect(res.body.data.answerSource).toBe('fallback');
    expect(res.body.data.grounding.usedVerifiedMemory).toBe(false);
    expect(res.body.data.grounding.llm).toBeNull();
    expect(res.body.data.memoryCard).toBeNull();
  });
});
