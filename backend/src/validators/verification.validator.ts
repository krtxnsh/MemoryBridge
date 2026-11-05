import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';
import { uuidSchema, paginationQuerySchema } from './common.validator.js';

export const reviewMemorySchema = z.object({
  comments: z.string().trim().max(1000, 'Comments cannot exceed 1000 characters').optional().nullable()
});

export const listVerificationsQuerySchema = paginationQuerySchema.extend({
  memoryId: uuidSchema.optional(),
  status: z.nativeEnum(VerificationStatus).optional()
});

