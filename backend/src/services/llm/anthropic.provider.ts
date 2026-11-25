import { LlmError, LlmGenerationRequest, LlmGenerationResult, LlmProvider } from './types.js';

export interface AnthropicProviderConfig {
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * Anthropic Messages API provider.
 *
 * The Anthropic API takes the system prompt as a top-level field and only
 * user/assistant turns in `messages`, so we split them here. The API key is read
 * on the backend only.
 */
export class AnthropicLlmProvider implements LlmProvider {
  readonly name = 'anthropic';
  readonly model: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config: AnthropicProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = (config.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
  }

  get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: LlmGenerationRequest): Promise<LlmGenerationResult> {
    if (!this.apiKey) {
      throw new LlmError('LLM_NOT_CONFIGURED', 'Anthropic API key is not configured.');
    }

    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          system,
          messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new LlmError('LLM_HTTP_ERROR', `Anthropic returned ${res.status}: ${detail.slice(0, 200)}`);
      }

      const json: any = await res.json();
      const text = Array.isArray(json?.content)
        ? json.content.map((block: any) => block?.text || '').join('').trim()
        : '';
      if (!text) {
        throw new LlmError('LLM_EMPTY_RESPONSE', 'Anthropic returned an empty completion.');
      }

      return { text, provider: this.name, model: this.model, latencyMs: Date.now() - start };
    } catch (err) {
      if (err instanceof LlmError) throw err;
      if ((err as Error)?.name === 'AbortError') {
        throw new LlmError('LLM_TIMEOUT', `Anthropic request timed out after ${request.timeoutMs}ms`, err);
      }
      throw new LlmError('LLM_NETWORK_ERROR', `Anthropic request failed: ${(err as Error).message}`, err);
    } finally {
      clearTimeout(timer);
    }
  }
}
