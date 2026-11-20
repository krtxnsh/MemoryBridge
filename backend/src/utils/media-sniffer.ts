import path from 'path';
import { MediaType } from '@prisma/client';
import { env } from '../config/env';

export interface AllowedMediaSpec {
  mediaType: MediaType;
  normalizedMime: string;
  allowedExtensions: string[];
  maxSizeBytes: number;
}

export const ALLOWED_MIME_TYPES: Record<string, AllowedMediaSpec> = {
  'image/jpeg': {
    mediaType: MediaType.IMAGE,
    normalizedMime: 'image/jpeg',
    allowedExtensions: ['.jpg', '.jpeg'],
    maxSizeBytes: env.MAX_IMAGE_BYTES
  },
  'image/png': {
    mediaType: MediaType.IMAGE,
    normalizedMime: 'image/png',
    allowedExtensions: ['.png'],
    maxSizeBytes: env.MAX_IMAGE_BYTES
  },
  'image/webp': {
    mediaType: MediaType.IMAGE,
    normalizedMime: 'image/webp',
    allowedExtensions: ['.webp'],
    maxSizeBytes: env.MAX_IMAGE_BYTES
  },
  'video/mp4': {
    mediaType: MediaType.VIDEO,
    normalizedMime: 'video/mp4',
    allowedExtensions: ['.mp4'],
    maxSizeBytes: env.MAX_VIDEO_BYTES
  },
  'video/webm': {
    mediaType: MediaType.VIDEO,
    normalizedMime: 'video/webm',
    allowedExtensions: ['.webm'],
    maxSizeBytes: env.MAX_VIDEO_BYTES
  },
  'audio/mpeg': {
    mediaType: MediaType.AUDIO,
    normalizedMime: 'audio/mpeg',
    allowedExtensions: ['.mp3'],
    maxSizeBytes: env.MAX_AUDIO_BYTES
  },
  'audio/wav': {
    mediaType: MediaType.AUDIO,
    normalizedMime: 'audio/wav',
    allowedExtensions: ['.wav'],
    maxSizeBytes: env.MAX_AUDIO_BYTES
  },
  'audio/x-wav': {
    mediaType: MediaType.AUDIO,
    normalizedMime: 'audio/wav',
    allowedExtensions: ['.wav'],
    maxSizeBytes: env.MAX_AUDIO_BYTES
  },
  'audio/mp4': {
    mediaType: MediaType.AUDIO,
    normalizedMime: 'audio/mp4',
    allowedExtensions: ['.m4a'],
    maxSizeBytes: env.MAX_AUDIO_BYTES
  },
  'audio/x-m4a': {
    mediaType: MediaType.AUDIO,
    normalizedMime: 'audio/mp4',
    allowedExtensions: ['.m4a'],
    maxSizeBytes: env.MAX_AUDIO_BYTES
  }
};

/**
 * Sanitizes original filename: strips paths and control characters, max length 255.
 */
export function sanitizeFileName(originalName: string): string {
  if (!originalName) return 'unnamed_file';
  // Strip paths
  const base = path.basename(originalName);
  // Strip control characters & non-printable ASCII/dangerous characters
  const clean = base.replace(/[\x00-\x1F\x7F]/g, '').trim();
  const safe = clean.length > 0 ? clean : 'unnamed_file';
  return safe.length > 255 ? safe.substring(0, 255) : safe;
}

/**
 * Validates that MIME type is allowed and matches the file extension.
 */
export function validateMimeAndExtension(fileName: string, mimeType: string): AllowedMediaSpec {
  const normalizedMime = mimeType.toLowerCase().trim();
  const spec = ALLOWED_MIME_TYPES[normalizedMime];
  if (!spec) {
    throw new Error(`Unsupported media MIME type: ${mimeType}`);
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!spec.allowedExtensions.includes(ext)) {
    throw new Error(
      `MIME type '${mimeType}' does not match file extension '${ext}'. Expected one of: ${spec.allowedExtensions.join(', ')}`
    );
  }

  return spec;
}

/**
 * Verifies file signature (magic bytes) from buffer.
 */
export function verifyFileSignature(buffer: Buffer, expectedMime: string): boolean {
  if (buffer.length < 4) {
    return false;
  }

  const normalized = expectedMime.toLowerCase().trim();

  // JPEG: FF D8 FF
  if (normalized === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (normalized === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // WEBP: RIFF at 0..3 and WEBP at 8..11
  if (normalized === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  }

  // MP4 / M4A: bytes 4..7 === 'ftyp'
  if (normalized === 'video/mp4' || normalized === 'audio/mp4' || normalized === 'audio/x-m4a') {
    if (buffer.length < 8) return false;
    return buffer.toString('ascii', 4, 8) === 'ftyp';
  }

  // WEBM: 1A 45 DF A3
  if (normalized === 'video/webm') {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  // MP3: ID3 or frame sync (0xFF and high 3 bits set of 2nd byte)
  if (normalized === 'audio/mpeg') {
    const isId3 = buffer.toString('ascii', 0, 3) === 'ID3';
    const isFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    return isId3 || isFrameSync;
  }

  // WAV: RIFF at 0..3 and WAVE at 8..11
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav') {
    if (buffer.length < 12) return false;
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWave = buffer.toString('ascii', 8, 12) === 'WAVE';
    return isRiff && isWave;
  }

  return false;
}

