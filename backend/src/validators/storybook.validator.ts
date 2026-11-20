import { z } from 'zod';
import { StorybookStatus } from '@prisma/client';
import { uuidSchema, profileImageSchema, paginationQuerySchema } from './common.validator.js';

export const createStorybookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  coverImage: profileImageSchema,
  generatedStory: z.string().trim().max(10000).optional().nullable(),
  status: z.nativeEnum(StorybookStatus).default(StorybookStatus.DRAFT),
  memoryIds: z.array(uuidSchema).optional()
});

export const updateStorybookSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  coverImage: profileImageSchema,
  generatedStory: z.string().trim().max(10000).optional().nullable(),
  status: z.nativeEnum(StorybookStatus).optional()
});

export const addOrSetStorybookMemoriesSchema = z.object({
  memoryIds: z.array(uuidSchema).optional(),
  memoryId: uuidSchema.optional(),
  sequenceOrder: z.coerce.number().int().min(1).optional()
}).refine(
  (data) => (data.memoryIds && data.memoryIds.length > 0) || Boolean(data.memoryId),
  { message: 'Must supply either memoryIds array or a single memoryId' }
);

export const listStorybooksQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(StorybookStatus).optional(),
  q: z.string().trim().optional()
});

