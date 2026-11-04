import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/memorybridge?schema=public'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev_jwt_access_secret_change_in_production_min_32_chars'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_jwt_refresh_secret_change_in_production_min_32_chars'),
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

