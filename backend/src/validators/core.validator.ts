import { z } from 'zod';
import { RoutinePeriod, RoutineCategory, VerificationStatus } from '@prisma/client';

export const createMemorySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional(),
  story: z.string().trim().min(1, 'Story is required'),
  audioDescription: z.string().trim().optional(),
  eventDate: z.string().datetime().optional().or(z.literal('')),
  approximateYear: z.coerce.number().int().min(1850).max(2100).optional(),
  location: z.string().trim().max(200).optional(),
  eventType: z.string().trim().max(100).optional(),
  era: z.string().trim().min(1, 'Era is required'),
  tags: z.array(z.string().trim()).default([]),
  albumId: z.string().uuid().optional().or(z.literal('')),
  songId: z.string().optional().or(z.literal('')),
  mapX: z.number().optional(),
  mapY: z.number().optional(),
  mapLabel: z.string().trim().optional(),
  peopleIds: z.array(z.string().uuid()).default([])
});

export const updateMemorySchema = createMemorySchema.partial();

export const verifyMemorySchema = z.object({
  status: z.enum([VerificationStatus.VERIFIED, VerificationStatus.REJECTED]),
  comments: z.string().trim().max(500).optional()
});

export const searchMemoryQuerySchema = z.object({
  q: z.string().trim().optional(),
  year: z.coerce.number().int().optional(),
  era: z.string().trim().optional(),
  location: z.string().trim().optional(),
  eventType: z.string().trim().optional(),
  personId: z.string().uuid().optional(),
  albumId: z.string().uuid().optional(),
  status: z.nativeEnum(VerificationStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const createPersonSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(100),
  biography: z.string().trim().max(1000).optional(),
  birthYear: z.coerce.number().int().min(1850).max(2100).optional(),
  profileImage: z.string().url().optional().or(z.literal('')),
  relationship: z.string().trim().max(100).optional()
});

export const updatePersonSchema = createPersonSchema.partial();

export const createRelationshipSchema = z.object({
  personOneId: z.string().uuid('personOneId must be a valid UUID'),
  personTwoId: z.string().uuid('personTwoId must be a valid UUID'),
  relationshipType: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional()
});

export const createAlbumSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  coverImage: z.string().optional(),
  colorTheme: z.string().trim().default('amber'),
  yearRange: z.string().trim().max(50).optional(),
  description: z.string().trim().max(500).optional()
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const createStorybookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  description: z.string().trim().max(500).optional(),
  coverImage: z.string().optional(),
  generatedStory: z.string().optional(),
  memoryIds: z.array(z.string().uuid()).default([])
});

export const reorderStorybookMemoriesSchema = z.object({
  memoryIds: z.array(z.string().uuid())
});

export const createRoutineItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  scheduledTime: z.string().trim().min(1, 'Scheduled time is required'),
  period: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(RoutinePeriod)
  ),
  category: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(RoutineCategory)
  ),
  notes: z.string().trim().max(500).optional()
});

export const updateRoutineItemSchema = createRoutineItemSchema.partial();

export const upsertDiarySchema = z.object({
  date: z.string().min(10, 'Date is required (YYYY-MM-DD)'),
  weather: z.string().trim().default('Sunny, 24°C'),
  greeting: z.string().trim().default('Good Evening'),
  morningNote: z.string().trim().default(''),
  afternoonNote: z.string().trim().default(''),
  eveningNote: z.string().trim().default(''),
  caregiverSign: z.string().trim().default('Anita')
});

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty'),
  conversationId: z.string().uuid().optional()
});
