/**
 * Provider-independent image-description contracts.
 *
 * An image-description provider proposes a *draft* caption for a photo. The
 * output is always stored as AI_SUGGESTED and is never shown to a patient until
 * a caregiver edits/approves it, so the provider itself carries no authority —
 * it only drafts. Keys for remote providers live on the backend only.
 */

export interface ImageDescriptionContext {
  /** Signed, time-limited URL a remote vision model can read (optional). */
  imageUrl?: string;
  mimeType?: string;
  /** Grounding hints from the memory the photo belongs to. */
  memoryTitle?: string;
  location?: string | null;
  approximateYear?: number | null;
  peopleNames?: string[];
  familyCaption?: string | null;
}

export interface ImageDescriptionResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface ImageDescriptionProvider {
  readonly name: string;
  readonly model: string;
  readonly configured: boolean;
  describe(context: ImageDescriptionContext, timeoutMs: number): Promise<ImageDescriptionResult>;
}

export class ImageDescriptionError extends Error {
  constructor(public readonly code: string, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ImageDescriptionError';
  }
}
