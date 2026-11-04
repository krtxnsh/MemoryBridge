import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';
import { paginationQuerySchema, uuidSchema } from './common.validator.js';

export const createMemorySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  story: z.string().trim().min(1, 'Story is required'),
  audioDescription: z.string().trim().max(1000).optional().nullable(),
  eventDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).or(z.literal('')).nullable(),
  approximateYear: z.coerce.number().int().min(1850).max(2100).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  eventType: z.string().trim().max(100).optional().nullable(),
  era: z.string().trim().min(1, 'Era is required').max(100),
  tags: z.array(z.string().trim().max(50)).default([]),
  albumId: uuidSchema.optional().or(z.literal('')).nullable(),
  songId: z.string().trim().max(100).optional().or(z.literal('')).nullable(),
  mapX: z.coerce.number().optional().nullable(),
  mapY: z.coerce.number().optional().nullable(),
  mapLabel: z.string().trim().max(100).optional().nullable(),
  personIds: z.array(uuidSchema).default([])
});

export const updateMemorySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  story: z.string().trim().min(1).optional(),
  audioDescription: z.string().trim().max(1000).optional().nullable(),
  eventDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).or(z.literal('')).nullable(),
  approximateYear: z.coerce.number().int().min(1850).max(2100).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  eventType: z.string().trim().max(100).optional().nullable(),
  era: z.string().trim().min(1).max(100).optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  albumId: uuidSchema.optional().or(z.literal('')).nullable(),
  songId: z.string().trim().max(100).optional().or(z.literal('')).nullable(),
  mapX: z.coerce.number().optional().nullable(),
  mapY: z.coerce.number().optional().nullable(),
  mapLabel: z.string().trim().max(100).optional().nullable(),
  personIds: z.array(uuidSchema).optional(),
  reverify: z.boolean().optional()
});

export const setMemoryPeopleSchema = z.object({
  personIds: z.array(uuidSchema)
});

export const searchMemoryQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  year: z.coerce.number().int().optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
  era: z.string().trim().optional(),
  location: z.string().trim().optional(),
  eventType: z.string().trim().optional(),
  personId: uuidSchema.optional(),
  albumId: uuidSchema.optional(),
  status: z.nativeEnum(VerificationStatus).optional(),
  tag: z.string().trim().optional(),
  sort: z.enum(['eventDate', 'approximateYear', 'createdAt', 'title']).default('eventDate')
});

