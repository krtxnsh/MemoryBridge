import { LlmError, LlmGenerationRequest, LlmGenerationResult, LlmProvider } from './types.js';

export interface OpenAiProviderConfig {
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * OpenAI-compatible Chat Completions provider.
 *
 * Works with the OpenAI API and any OpenAI-compatible endpoint (Azure OpenAI,
 * local gateways, OpenRouter, etc.) via `baseUrl`. The API key is read on the
 * backend only and is never returned to the client.
 */
export class OpenAiLlmProvider implements LlmProvider {
  readonly name = 'openai';
  readonly model: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config: OpenAiProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  }

  get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: LlmGenerationRequest): Promise<LlmGenerationResult> {
    if (!this.apiKey) {
      throw new LlmError('LLM_NOT_CONFIGURED', 'OpenAI API key is not configured.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new LlmError('LLM_HTTP_ERROR', `OpenAI returned ${res.status}: ${detail.slice(0, 200)}`);
      }

      const json: any = await res.json();
      const text = json?.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new LlmError('LLM_EMPTY_RESPONSE', 'OpenAI returned an empty completion.');
      }

      return { text, provider: this.name, model: this.model, latencyMs: Date.now() - start };
    } catch (err) {
      if (err instanceof LlmError) throw err;
      if ((err as Error)?.name === 'AbortError') {
        throw new LlmError('LLM_TIMEOUT', `OpenAI request timed out after ${request.timeoutMs}ms`, err);
      }
      throw new LlmError('LLM_NETWORK_ERROR', `OpenAI request failed: ${(err as Error).message}`, err);
    } finally {
      clearTimeout(timer);
    }
  }
}
