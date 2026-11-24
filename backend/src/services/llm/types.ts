/**
 * Provider-independent LLM integration contracts.
 *
 * MemoryBridge never lets a language model invent personal history. The LLM is
 * only ever used to *phrase* a warm, short answer from facts that have already
 * been retrieved from family-verified memories. Every provider implements the
 * same narrow interface so the backend can swap OpenAI, Anthropic, a local
 * model, or the deterministic mock without touching companion logic.
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmGenerationRequest {
  messages: LlmMessage[];
  /** Hard cap on generated tokens. */
  maxTokens: number;
  /** Low temperature keeps grounding tight; providers may clamp. */
  temperature: number;
  /** Abort the request after this many milliseconds. */
  timeoutMs: number;
}

export interface LlmGenerationResult {
  text: string;
  provider: string;
  model: string;
  /** Milliseconds spent in the provider call (best effort). */
  latencyMs: number;
}

/**
 * A provider is considered "configured" when it has everything it needs to make
 * a real call (e.g. an API key). An unconfigured remote provider must report
 * `configured === false` so the companion falls back to the deterministic reply
 * instead of throwing.
 */
export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  readonly configured: boolean;
  generate(request: LlmGenerationRequest): Promise<LlmGenerationResult>;
}

export class LlmError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LlmError';
  }
}
