import env from "./index.js";

interface Config {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  CORS_ORIGIN: string;
  SERVO_SESSION_ACCESS_TOKEN_EXPIRES?: string;
  SERVO_SESSION_REFRESH_TOKEN_EXPIRES?: string;
  SERVO_SESSION_ACCESS_TOKEN_NAME: string;
  SERVO_SESSION_REFRESH_TOKEN_NAME: string;
  CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_SECRET_KEY: string;
  ENCRYPTION_KEY: string;
  seed: {
    adminPassword: string;
    superAdminPassword: string;
  };
}

export const config: Config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET: env.JWT_SECRET,
  LOG_LEVEL: env.LOG_LEVEL,
  CORS_ORIGIN: env.CORS_ORIGIN,
  SERVO_SESSION_ACCESS_TOKEN_EXPIRES: env.SERVO_SESSION_ACCESS_TOKEN_EXPIRES,
  SERVO_SESSION_REFRESH_TOKEN_EXPIRES: env.SERVO_SESSION_REFRESH_TOKEN_EXPIRES,
  SERVO_SESSION_ACCESS_TOKEN_NAME: env.SERVO_SESSION_ACCESS_TOKEN_NAME,
  SERVO_SESSION_REFRESH_TOKEN_NAME: env.SERVO_SESSION_REFRESH_TOKEN_NAME,
  CLOUD_NAME: env.CLOUD_NAME,
  CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET_KEY: env.CLOUDINARY_SECRET_KEY,
  ENCRYPTION_KEY: env.ENCRYPTION_KEY,
  seed: {
    adminPassword: env.ADMIN_PASSWORD,
    superAdminPassword: env.SUPER_ADMIN_PASSWORD,
  },
};

export type { Config };
export default config;
