import { env } from '../../config/env';
import { MockImageDescriptionProvider } from './mock.provider';
import { OpenAiVisionProvider } from './openai.provider';
import { ImageDescriptionProvider } from './types';

export * from './types';

let cached: ImageDescriptionProvider | null = null;
let cachedKey: string | null = null;

/**
 * Returns the configured image-description provider, or null when disabled
 * (IMAGE_DESCRIPTION_PROVIDER=none) or a remote provider is selected without a
 * key. Never throws.
 */
export function getImageDescriptionProvider(): ImageDescriptionProvider | null {
  const provider = (env as any).IMAGE_DESCRIPTION_PROVIDER || 'none';
  const model = (env as any).IMAGE_DESCRIPTION_MODEL || '';
  const apiKey = (env as any).IMAGE_DESCRIPTION_API_KEY || '';
  const baseUrl = (env as any).IMAGE_DESCRIPTION_BASE_URL || '';
  const key = `${provider}:${model}:${baseUrl}:${apiKey ? 'k' : 'nokey'}`;

  if (cached !== null && cachedKey === key) return cached;
  cachedKey = key;

  if (provider === 'none') {
    cached = null;
    return null;
  }

  let instance: ImageDescriptionProvider | null = null;
  if (provider === 'mock') {
    instance = new MockImageDescriptionProvider();
  } else if (provider === 'openai') {
    instance = new OpenAiVisionProvider({ apiKey, model: model || 'gpt-4o-mini', baseUrl });
  }

  cached = instance && instance.configured ? instance : null;
  return cached;
}

/** For tests: drop the cached provider so env changes take effect. */
export function resetImageDescriptionProvider(): void {
  cached = null;
  cachedKey = null;
}

export function imageDescriptionTimeoutMs(): number {
  return (env as any).IMAGE_DESCRIPTION_TIMEOUT_MS || 12000;
}
