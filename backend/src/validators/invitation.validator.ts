import { z } from 'zod';

export const createInvitationSchema = z.object({
  accessRole: z.enum(['FAMILY', 'VIEWER']).default('FAMILY'),
  relationship: z.string().trim().min(1, 'Relationship is required').max(100),
  expiresInHours: z.coerce.number().int().min(1).max(168).default(72)
});

export const redeemInvitationSchema = z.object({
  code: z.string().trim().min(8).max(20)
});
