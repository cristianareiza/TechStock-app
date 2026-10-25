import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_USERS } from '../src/database/seed.js';
import { bearer, setupTestApp, type TestContext } from './helpers.js';

describe('Autenticación /api/auth', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestApp({ products: false });
  });

  it('inicia sesión con credenciales válidas y devuelve token sin contraseña', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: DEMO_USERS.admin.email, password: DEMO_USERS.admin.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: DEMO_USERS.admin.email, role: 'admin' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('acepta el correo sin importar mayúsculas ni espacios', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: '  ADMIN@TechStock.com ', password: DEMO_USERS.admin.password });
    expect(res.status).toBe(200);
  });

  it('rechaza una contraseña incorrecta con 401', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: DEMO_USERS.admin.email, password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Correo o contraseña incorrectos');
  });

  it('valida el formato de los datos con 400', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ email: 'no-es-correo' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
    );
  });

  it('responde 400 cuando el JSON está mal formado', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
  });

  it('GET /me devuelve el perfil del usuario autenticado', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set(bearer(ctx.employeeToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: DEMO_USERS.employee.email, role: 'employee' });
  });

  it('GET /me sin token responde 401', async () => {
    const res = await request(ctx.app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me con token falso responde 401', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set(bearer('token.falso.123'));
    expect(res.status).toBe(401);
  });

  it('un usuario desactivado no puede iniciar sesión', async () => {
    ctx.db.prepare('UPDATE users SET active = 0 WHERE email = ?').run(DEMO_USERS.employee.email);
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: DEMO_USERS.employee.email, password: DEMO_USERS.employee.password });

    expect(res.status).toBe(403);
  });

  it('responde 404 en rutas de la API inexistentes', async () => {
    const res = await request(ctx.app).get('/api/no-existe');
    expect(res.status).toBe(404);
  });
});
