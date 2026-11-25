import { ImageDescriptionContext, ImageDescriptionProvider, ImageDescriptionResult } from './types';

/**
 * Deterministic, offline image-description provider.
 *
 * It does not analyse pixels; it drafts a neutral, clearly-provisional caption
 * from the memory context the caregiver already provided. It never asserts
 * identities or facts beyond those hints, and its output is marked AI_SUGGESTED
 * and gated behind caregiver approval — so it is safe to use by default and in
 * tests without any credentials.
 */
export class MockImageDescriptionProvider implements ImageDescriptionProvider {
  readonly name = 'mock';
  readonly model = 'mock-vision-v1';
  readonly configured = true;

  async describe(context: ImageDescriptionContext): Promise<ImageDescriptionResult> {
    const start = Date.now();
    const parts: string[] = ['A photograph'];

    if (context.memoryTitle) parts.push(`from the memory "${context.memoryTitle}"`);
    if (context.approximateYear) parts.push(`around ${context.approximateYear}`);
    if (context.location) parts.push(`at ${context.location}`);

    let text = parts.join(' ') + '.';
    if (context.peopleNames && context.peopleNames.length > 0) {
      text += ` It may include ${context.peopleNames.join(', ')}.`;
    }
    text += ' [AI-suggested draft — please review and edit before approving for the patient.]';

    return {
      text,
      provider: this.name,
      model: this.model,
      latencyMs: Date.now() - start
    };
  }
}
