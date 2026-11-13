import { z } from 'zod';
import { profileImageSchema } from './common.validator.js';

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  relationship: z.string().trim().max(100).default('Caregiver'),
  dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).or(z.literal('')),
  profileImage: profileImageSchema,
  preferredLanguage: z.string().trim().max(10).default('en'),
  biography: z.string().trim().max(1000).optional().or(z.literal(''))
});

export const updatePatientSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name cannot be empty').max(100).optional(),
  dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).or(z.literal('')).nullable(),
  profileImage: profileImageSchema,
  preferredLanguage: z.string().trim().max(10).optional(),
  biography: z.string().trim().max(1000).optional().nullable()
});

export const createPatientSessionSchema = z.object({
  durationMinutes: z.coerce.number().int().min(15).max(10080).default(1440) // Default 24 hours
});
