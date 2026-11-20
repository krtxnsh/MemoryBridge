import { z } from 'zod';
import { paginationQuerySchema } from './common.validator.js';

export const createDiarySchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  weather: z.string().trim().max(100).default('Sunny & Warm'),
  greeting: z.string().trim().max(200).default('Good Evening'),
  morningNote: z.string().trim().max(2000).default(''),
  afternoonNote: z.string().trim().max(2000).default(''),
  eveningNote: z.string().trim().max(2000).default(''),
  caregiverSign: z.string().trim().max(100).default('Care Team')
});

export const updateDiarySchema = z.object({
  weather: z.string().trim().max(100).optional(),
  greeting: z.string().trim().max(200).optional(),
  morningNote: z.string().trim().max(2000).optional(),
  afternoonNote: z.string().trim().max(2000).optional(),
  eveningNote: z.string().trim().max(2000).optional(),
  caregiverSign: z.string().trim().max(100).optional()
});

export const listDiaryQuerySchema = paginationQuerySchema.extend({
  date: z.string().optional()
});

