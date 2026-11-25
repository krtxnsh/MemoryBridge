import {
  ImageDescriptionContext,
  ImageDescriptionError,
  ImageDescriptionProvider,
  ImageDescriptionResult
} from './types';

export interface OpenAiVisionConfig {
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * OpenAI-compatible vision provider (Chat Completions with an image_url part).
 * The API key is read on the backend only. Requires a readable `imageUrl` in the
 * context; callers pass a short-lived signed URL. Not exercised in CI (needs a
 * key) — the structure, timeout and error handling mirror the LLM providers.
 */
export class OpenAiVisionProvider implements ImageDescriptionProvider {
  readonly name = 'openai';
  readonly model: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(config: OpenAiVisionConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  }

  get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async describe(context: ImageDescriptionContext, timeoutMs: number): Promise<ImageDescriptionResult> {
    if (!this.apiKey) {
      throw new ImageDescriptionError('VISION_NOT_CONFIGURED', 'OpenAI vision API key is not configured.');
    }
    if (!context.imageUrl) {
      throw new ImageDescriptionError('VISION_NO_IMAGE', 'A readable image URL is required for vision description.');
    }

    const hint = [
      context.memoryTitle ? `Memory: ${context.memoryTitle}.` : '',
      context.location ? `Location: ${context.location}.` : '',
      context.approximateYear ? `Year: ${context.approximateYear}.` : '',
      context.peopleNames?.length ? `People possibly present: ${context.peopleNames.join(', ')}.` : ''
    ]
      .filter(Boolean)
      .join(' ');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 300,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You draft a short, gentle, factual caption for a family photo for a dementia memory app. ' +
                'Describe only what is visibly in the image. Do not guess names or invent events. ' +
                'This is a draft a caregiver will review before a patient ever sees it.'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Describe this photo in 1-2 calm sentences. ${hint}`.trim() },
                { type: 'image_url', image_url: { url: context.imageUrl } }
              ]
            }
          ]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new ImageDescriptionError('VISION_HTTP_ERROR', `OpenAI vision returned ${res.status}: ${detail.slice(0, 200)}`);
      }

      const json: any = await res.json();
      const text = json?.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new ImageDescriptionError('VISION_EMPTY_RESPONSE', 'OpenAI vision returned an empty description.');
      }

      return { text, provider: this.name, model: this.model, latencyMs: Date.now() - start };
    } catch (err) {
      if (err instanceof ImageDescriptionError) throw err;
      if ((err as Error)?.name === 'AbortError') {
        throw new ImageDescriptionError('VISION_TIMEOUT', `OpenAI vision timed out after ${timeoutMs}ms`, err);
      }
      throw new ImageDescriptionError('VISION_NETWORK_ERROR', `OpenAI vision request failed: ${(err as Error).message}`, err);
    } finally {
      clearTimeout(timer);
    }
  }
}
