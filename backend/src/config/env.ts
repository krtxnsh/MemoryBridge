import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const PLACEHOLDER_ACCESS = 'dev_jwt_access_secret_change_in_production_min_32_chars';
const PLACEHOLDER_REFRESH = 'dev_jwt_refresh_secret_change_in_production_min_32_chars';

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/memorybridge?schema=public'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    DEMO_MODE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),

    // Storage configuration
    STORAGE_PROVIDER: z.enum(['local', 'firebase', 'mock']).default(process.env.NODE_ENV === 'test' ? 'mock' : 'local'),
    UPLOAD_DIR: z.string().default('./uploads'),
    STORAGE_SIGNING_SECRET: z.string().min(16).optional(),

    // Storage limits & quotas
    MAX_IMAGE_BYTES: z.coerce.number().int().default(10 * 1024 * 1024), // 10MB
    MAX_AUDIO_BYTES: z.coerce.number().int().default(25 * 1024 * 1024), // 25MB
    MAX_VIDEO_BYTES: z.coerce.number().int().default(200 * 1024 * 1024), // 200MB
    UPLOAD_URL_TTL_SEC: z.coerce.number().int().default(600), // 10 minutes
    MEDIA_READ_URL_TTL_SEC: z.coerce.number().int().default(3600), // 1 hour
    MAX_MEDIA_PER_MEMORY: z.coerce.number().int().default(20),
    PATIENT_STORAGE_QUOTA_BYTES: z.coerce.number().int().default(5 * 1024 * 1024 * 1024), // 5GB
    MAX_PENDING_UPLOADS_PER_USER: z.coerce.number().int().default(10),

    // Firebase Storage credentials (validated if STORAGE_PROVIDER === 'firebase')
    FIREBASE_PROJECT_ID: z.string().optional().default(''),
    FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),
    FIREBASE_PRIVATE_KEY: z.string().optional().default(''),
    FIREBASE_STORAGE_BUCKET: z.string().optional().default(''),

    AI_PROVIDER: z.enum(['none', 'rule_based']).default('none')
  })
  .superRefine((data, ctx) => {
    // Separate secrets requirement
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
        path: ['JWT_REFRESH_SECRET']
      });
    }

    // Storage provider check: local is forbidden in production
    if (data.NODE_ENV === 'production' && data.STORAGE_PROVIDER === 'local') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'STORAGE_PROVIDER=local is forbidden in production. Must use firebase.',
        path: ['STORAGE_PROVIDER']
      });
    }

    // In production, reject placeholders
    if (data.NODE_ENV === 'production') {
      if (data.JWT_ACCESS_SECRET === PLACEHOLDER_ACCESS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Default placeholder JWT_ACCESS_SECRET cannot be used in production',
          path: ['JWT_ACCESS_SECRET']
        });
      }
      if (data.JWT_REFRESH_SECRET === PLACEHOLDER_REFRESH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Default placeholder JWT_REFRESH_SECRET cannot be used in production',
          path: ['JWT_REFRESH_SECRET']
        });
      }
    }

    // If STORAGE_PROVIDER=firebase, strictly validate all Firebase configuration keys
    if (data.STORAGE_PROVIDER === 'firebase') {
      if (!data.FIREBASE_PROJECT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FIREBASE_PROJECT_ID is required when STORAGE_PROVIDER=firebase',
          path: ['FIREBASE_PROJECT_ID']
        });
      }
      if (!data.FIREBASE_CLIENT_EMAIL || !data.FIREBASE_CLIENT_EMAIL.includes('@')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid FIREBASE_CLIENT_EMAIL is required when STORAGE_PROVIDER=firebase',
          path: ['FIREBASE_CLIENT_EMAIL']
        });
      }
      if (!data.FIREBASE_PRIVATE_KEY || data.FIREBASE_PRIVATE_KEY.length < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valid FIREBASE_PRIVATE_KEY is required when STORAGE_PROVIDER=firebase',
          path: ['FIREBASE_PRIVATE_KEY']
        });
      }
      if (!data.FIREBASE_STORAGE_BUCKET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FIREBASE_STORAGE_BUCKET is required when STORAGE_PROVIDER=firebase',
          path: ['FIREBASE_STORAGE_BUCKET']
        });
      }
    }
  });

export function parseEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.format();
    console.error('Invalid environment variables:', errorDetails);
    throw new Error(`Environment validation failed: ${JSON.stringify(errorDetails)}`);
  }
  return result.data;
}

export const env = (() => {
  try {
    return parseEnv(process.env);
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    // Fallback for tests if needed
    return process.env as any;
  }
})();
