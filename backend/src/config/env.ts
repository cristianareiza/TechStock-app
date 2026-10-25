import { config } from 'dotenv';

config({ quiet: true });

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'techstock-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  dbPath: process.env.DB_PATH ?? 'data/techstock.db',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
} as const;

export const isTest = env.nodeEnv === 'test';
export const isProduction = env.nodeEnv === 'production';
