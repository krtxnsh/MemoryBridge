import { z } from 'zod';

export const companionMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text is required').max(1000),
  context: z.object({
    screen: z.string().trim().max(100).optional()
  }).optional()
});

