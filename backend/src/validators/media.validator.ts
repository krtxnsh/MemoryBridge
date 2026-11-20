import { z } from 'zod';
import { MediaUploadPurpose } from '@prisma/client';

export const createUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1, 'fileName is required').max(255),
  mimeType: z.string().trim().min(1, 'mimeType is required').max(100),
  sizeBytes: z.number().int().positive('sizeBytes must be greater than 0'),
  purpose: z.nativeEnum(MediaUploadPurpose).optional().default(MediaUploadPurpose.MEMORY_MEDIA),
  memoryId: z.string().uuid('Invalid memoryId UUID format').optional(),
  targetId: z.string().uuid('Invalid targetId UUID format').optional()
});

export const confirmUploadSchema = z.object({
  uploadId: z.string().uuid('Invalid uploadId UUID format'),
  caption: z.string().trim().max(500).optional(),
  memoryId: z.string().uuid('Invalid memoryId UUID format').optional(),
  reverify: z.boolean().optional().default(false)
});

export const updateMediaSchema = z.object({
  caption: z.string().trim().max(500).optional(),
  memoryId: z.string().uuid('Invalid memoryId UUID format').nullable().optional(),
  reverify: z.boolean().optional().default(false)
});

export const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  memoryId: z.string().uuid('Invalid memoryId UUID format').optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'AUDIO']).optional()
});

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type ListMediaQueryInput = z.infer<typeof listMediaQuerySchema>;

