import { z } from 'zod';
import { profileImageSchema, paginationQuerySchema } from './common.validator.js';

export const createAlbumSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  coverImage: profileImageSchema,
  colorTheme: z.string().trim().max(50).default('amber'),
  yearRange: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable()
});

export const updateAlbumSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  coverImage: profileImageSchema,
  colorTheme: z.string().trim().max(50).optional(),
  yearRange: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable()
});

export const listAlbumsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional()
});

