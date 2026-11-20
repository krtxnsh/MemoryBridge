import { z } from 'zod';
import { profileImageSchema, paginationQuerySchema } from './common.validator.js';

export const createPersonSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  biography: z.string().trim().max(2000).optional().nullable(),
  birthYear: z.coerce.number().int().min(1850).max(new Date().getFullYear()).optional().nullable(),
  profileImage: profileImageSchema,
  confirmedByFamily: z.boolean().default(true),
  relationship: z.string().trim().min(1).max(100).optional().nullable()
});

export const updatePersonSchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  biography: z.string().trim().max(2000).optional().nullable(),
  birthYear: z.coerce.number().int().min(1850).max(new Date().getFullYear()).optional().nullable(),
  profileImage: profileImageSchema,
  confirmedByFamily: z.boolean().optional(),
  relationship: z.string().trim().min(1).max(100).optional().nullable()
});

export const listPeopleQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  confirmedOnly: z.coerce.boolean().optional()
});

