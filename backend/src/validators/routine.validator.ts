import { z } from 'zod';
import { RoutinePeriod, RoutineCategory, ReminderStatus } from '@prisma/client';
import { paginationQuerySchema } from './common.validator.js';

export const time24Regex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createRoutineSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  scheduledTime: z.string().regex(time24Regex, 'scheduledTime must be in HH:mm 24-hour format (e.g. 08:30)'),
  period: z.nativeEnum(RoutinePeriod),
  category: z.nativeEnum(RoutineCategory),
  notes: z.string().trim().max(1000).optional().nullable(),
  completed: z.boolean().default(false),
  reminderStatus: z.nativeEnum(ReminderStatus).default(ReminderStatus.ACTIVE)
});

export const updateRoutineSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  scheduledTime: z.string().regex(time24Regex, 'scheduledTime must be in HH:mm 24-hour format (e.g. 08:30)').optional(),
  period: z.nativeEnum(RoutinePeriod).optional(),
  category: z.nativeEnum(RoutineCategory).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  completed: z.boolean().optional(),
  reminderStatus: z.nativeEnum(ReminderStatus).optional()
});

export const completeRoutineSchema = z.object({
  completed: z.boolean().optional() // defaults to toggle or true if omitted
});

export const listRoutineQuerySchema = paginationQuerySchema.extend({
  period: z.nativeEnum(RoutinePeriod).optional(),
  category: z.nativeEnum(RoutineCategory).optional(),
  completed: z.coerce.boolean().optional(),
  reminderStatus: z.nativeEnum(ReminderStatus).optional(),
  upcoming: z.coerce.boolean().optional()
});

