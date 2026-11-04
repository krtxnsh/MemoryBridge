import { z } from 'zod';

export const requestUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  mimeType: z.string().trim().min(1, 'MIME type is required'),
  sizeBytes: z.coerce.number().int().positive('Size in bytes must be positive')
});

export const confirmUploadSchema = z.object({
  storagePath: z.string().trim().min(1, 'Storage path is required'),
  fileName: z.string().trim().min(1, 'File name is required'),
  mimeType: z.string().trim().min(1, 'MIME type is required'),
  sizeBytes: z.coerce.number().int().positive('Size in bytes must be positive'),
  memoryId: z.string().uuid().optional().or(z.literal('')),
  caption: z.string().trim().max(300).optional()
});
