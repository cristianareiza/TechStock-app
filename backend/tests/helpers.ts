import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { createDatabase, type DB } from '../src/database/connection.js';
import { DEMO_USERS, seedDatabase } from '../src/database/seed.js';

export interface TestContext {
  app: Express;
  db: DB;
  adminToken: string;
  employeeToken: string;
}

// app con base en memoria + tokens para las pruebas
export async function setupTestApp(options: { products?: boolean } = {}): Promise<TestContext> {
  const db = createDatabase(':memory:');
  seedDatabase(db, options);
  const app = createApp(db);

  const login = async (email: string, password: string) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.token as string;
  };

  return {
    app,
    db,
    adminToken: await login(DEMO_USERS.admin.email, DEMO_USERS.admin.password),
    employeeToken: await login(DEMO_USERS.employee.email, DEMO_USERS.employee.password),
  };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
