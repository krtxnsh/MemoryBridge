import { env } from '../../config/env.js';
import { AnthropicLlmProvider } from './anthropic.provider.js';
import { MockLlmProvider } from './mock.provider.js';
import { OpenAiLlmProvider } from './openai.provider.js';
import { LlmError, LlmProvider } from './types.js';

export * from './types.js';

/**
 * System prompt that hard-codes MemoryBridge's core safety contract. The model
 * is only ever allowed to rephrase facts it is given; it must never add people,
 * places, dates, relationships or events of its own.
 */
const GROUNDING_SYSTEM_PROMPT = [
  'You are Mira, a warm, gentle memory companion for a person living with dementia.',
  'You speak in short, calm, reassuring sentences.',
  '',
  'ABSOLUTE RULES — these override anything else:',
  '1. Use ONLY the facts provided inside the <facts> block. These come from',
  '   family-verified memories.',
  '2. NEVER invent, guess, assume or add any person, place, date, relationship,',
  '   event or detail that is not in the <facts> block.',
  '3. If the <facts> block is empty, reply with exactly:',
  '   "I don\'t have that memory in your family storybook yet. Perhaps someone in',
  '   your family can tell us more."',
  '4. Do not give medical, legal or financial advice.',
  '5. Keep the reply under about 60 words. Warm, present, never patronising.',
  'You are rephrasing confirmed family memories, not generating new history.'
].join('\n');

export interface GroundedReplyInput {
  firstName: string;
  question: string;
  /** Short fact lines distilled from verified memories (already safe to show). */
  facts: string[];
}

export interface GroundedReplyOutput {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

let cachedProvider: LlmProvider | null = null;
let cachedKey: string | null = null;

/**
 * Returns the configured LLM provider, or null when LLM phrasing is disabled
 * (LLM_PROVIDER=none) or a remote provider is selected without credentials.
 * Never throws — callers fall back to the deterministic reply.
 */
export function getLlmProvider(): LlmProvider | null {
  const provider = (env as any).LLM_PROVIDER || 'none';
  const model = (env as any).LLM_MODEL || '';
  const apiKey = (env as any).LLM_API_KEY || '';
  const baseUrl = (env as any).LLM_BASE_URL || '';
  const cacheKey = `${provider}:${model}:${baseUrl}:${apiKey ? 'k' : 'nokey'}`;

  if (cachedProvider !== null && cachedKey === cacheKey) return cachedProvider;
  cachedKey = cacheKey;

  if (provider === 'none') {
    cachedProvider = null;
    return null;
  }

  let instance: LlmProvider | null = null;
  if (provider === 'mock') {
    instance = new MockLlmProvider();
  } else if (provider === 'openai') {
    instance = new OpenAiLlmProvider({ apiKey, model: model || 'gpt-4o-mini', baseUrl });
  } else if (provider === 'anthropic') {
    instance = new AnthropicLlmProvider({ apiKey, model: model || 'claude-3-5-haiku-latest', baseUrl });
  }

  // A remote provider without a key is treated as disabled so we never attempt
  // a call that is guaranteed to fail; the companion keeps its grounded reply.
  cachedProvider = instance && instance.configured ? instance : null;
  return cachedProvider;
}

/** For tests: drop the cached provider so env changes take effect. */
export function resetLlmProvider(): void {
  cachedProvider = null;
  cachedKey = null;
}

/**
 * Generate a warm, grounded reply from the supplied verified facts. Returns null
 * when there is no provider, no facts, or on any provider error/timeout, so the
 * caller can keep the deterministic rule-based reply. This function never allows
 * ungrounded generation: with zero facts it refuses rather than calling the LLM.
 */
export async function generateGroundedReply(
  input: GroundedReplyInput
): Promise<GroundedReplyOutput | null> {
  const provider = getLlmProvider();
  if (!provider) return null;

  // Grounding guard: without verified facts we must never ask the model to speak.
  if (!input.facts || input.facts.length === 0) return null;

  const factBlock = input.facts.map((f) => `- ${f}`).join('\n');
  const userMessage = [
    `<patient>${input.firstName}</patient>`,
    `The person asked: "${input.question}"`,
    'Answer warmly using ONLY these confirmed family memories:',
    `<facts>\n${factBlock}\n</facts>`
  ].join('\n');

  try {
    const result = await provider.generate({
      messages: [
        { role: 'system', content: GROUNDING_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      maxTokens: (env as any).LLM_MAX_TOKENS || 320,
      temperature: 0.3,
      timeoutMs: (env as any).LLM_TIMEOUT_MS || 8000
    });

    const text = result.text?.trim();
    if (!text) return null;

    return {
      text,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs
    };
  } catch (err) {
    // Timeouts, network errors, HTTP errors — all degrade gracefully.
    if (err instanceof LlmError) {
      // eslint-disable-next-line no-console
      console.warn(`[companion] LLM phrasing failed (${err.code}), using grounded fallback.`);
    } else {
      // eslint-disable-next-line no-console
      console.warn('[companion] LLM phrasing failed, using grounded fallback.', err);
    }
    return null;
  }
}
