import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

// Allowed: null/empty, relative asset path (/assets/...), or storage path (patients/{id}/...)
export const profileImageSchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine((val) => {
    if (!val) return true;
    if (val.startsWith('/assets/')) return true;
    if (/^patients\/[a-f0-9-]+\/.+$/i.test(val)) return true;
    // Reject arbitrary external URLs (http://, https://, etc.)
    return false;
  }, {
    message: 'Profile image must be null, a relative asset path (/assets/...), or a storage path (patients/{patientId}/...)'
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
});

export function validateUuidParams(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (val) {
        const result = uuidSchema.safeParse(val);
        if (!result.success) {
          sendError(res, 'VALIDATION_ERROR', `Parameter '${name}' must be a valid UUID.`, 400);
          return;
        }
      }
    }
    next();
  };
}
