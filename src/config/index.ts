import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((val) => Number(val)),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().optional(),
  JWT_REFRESH_EXPIRES: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SERVO_SESSION_ACCESS_TOKEN_EXPIRES: z.string().default("15m"),
  SERVO_SESSION_REFRESH_TOKEN_EXPIRES: z.string().default("7d"),
  SERVO_SESSION_ACCESS_TOKEN_NAME: z.string().default("demo_access_token"),
  SERVO_SESSION_REFRESH_TOKEN_NAME: z.string().default("demo_refresh_token"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_SECRET_KEY: z.string().min(1),
  ENCRYPTION_KEY:z.string().min(24),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export type Env = typeof env;

export default env;