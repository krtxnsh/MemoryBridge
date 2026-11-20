import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from './common.validator.js';

export const createRelationshipSchema = z.object({
  personOneId: uuidSchema,
  personTwoId: uuidSchema,
  relationshipType: z.string().trim().min(1, 'Relationship type is required').max(100),
  description: z.string().trim().max(500).optional().nullable()
}).refine((data) => data.personOneId !== data.personTwoId, {
  message: 'A person cannot have a relationship with themselves',
  path: ['personTwoId']
});

export const updateRelationshipSchema = z.object({
  relationshipType: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable()
});

export const listRelationshipsQuerySchema = paginationQuerySchema.extend({
  personId: uuidSchema.optional()
});

