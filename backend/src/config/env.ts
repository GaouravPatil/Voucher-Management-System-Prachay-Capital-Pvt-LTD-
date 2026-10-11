import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(2),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  REVIEWERS_SEE_DRAFTS: z.coerce.boolean().default(false),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(10),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
