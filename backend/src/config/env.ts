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
    STORAGE_PROVIDER: z.enum(['local', 'firebase']).default('local'),
    UPLOAD_DIR: z.string().default('./uploads'),
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
