import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, setupTestApp, type TestContext } from './helpers.js';

const newUser = {
  name: 'Carlos Pérez',
  email: 'carlos@techstock.com',
  password: 'Segura123',
  role: 'employee',
};

describe('CRUD de usuarios /api/users', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestApp({ products: false });
  });

  describe('permisos', () => {
    it('un empleado no puede acceder al módulo de usuarios (403)', async () => {
      const res = await request(ctx.app).get('/api/users').set(bearer(ctx.employeeToken));
      expect(res.status).toBe(403);
    });

    it('sin token responde 401', async () => {
      const res = await request(ctx.app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  describe('Create', () => {
    it('crea un usuario y no expone la contraseña', async () => {
      const res = await request(ctx.app).post('/api/users').set(bearer(ctx.adminToken)).send(newUser);

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe(`/api/users/${res.body.data.id}`);
      expect(res.body.data).toMatchObject({ name: newUser.name, email: newUser.email, active: true });
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('el usuario creado puede iniciar sesión', async () => {
      await request(ctx.app).post('/api/users').set(bearer(ctx.adminToken)).send(newUser);
      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: newUser.email, password: newUser.password });
      expect(res.status).toBe(200);
    });

    it('rechaza correos duplicados con 409', async () => {
      await request(ctx.app).post('/api/users').set(bearer(ctx.adminToken)).send(newUser);
      const res = await request(ctx.app).post('/api/users').set(bearer(ctx.adminToken)).send(newUser);
      expect(res.status).toBe(409);
    });

    it('rechaza contraseñas débiles con 400', async () => {
      const res = await request(ctx.app)
        .post('/api/users')
        .set(bearer(ctx.adminToken))
        .send({ ...newUser, password: 'debil' });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0].field).toBe('password');
    });
  });

  describe('Read', () => {
    it('lista todos los usuarios', async () => {
      const res = await request(ctx.app).get('/api/users').set(bearer(ctx.adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('obtiene un usuario por id', async () => {
      const res = await request(ctx.app).get('/api/users/1').set(bearer(ctx.adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });

    it('responde 404 si el usuario no existe', async () => {
      const res = await request(ctx.app).get('/api/users/999').set(bearer(ctx.adminToken));
      expect(res.status).toBe(404);
    });

    it('responde 400 si el id no es válido', async () => {
      const res = await request(ctx.app).get('/api/users/abc').set(bearer(ctx.adminToken));
      expect(res.status).toBe(400);
    });
  });

  describe('Update', () => {
    it('actualiza parcialmente un usuario', async () => {
      const res = await request(ctx.app)
        .put('/api/users/2')
        .set(bearer(ctx.adminToken))
        .send({ name: 'Laura Gómez Ríos', role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ name: 'Laura Gómez Ríos', role: 'admin' });
    });

    it('cambia la contraseña y la nueva funciona', async () => {
      await request(ctx.app)
        .put('/api/users/2')
        .set(bearer(ctx.adminToken))
        .send({ password: 'NuevaClave99' });

      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: 'empleado@techstock.com', password: 'NuevaClave99' });
      expect(res.status).toBe(200);
    });

    it('no permite quitar el rol al último administrador', async () => {
      const res = await request(ctx.app)
        .put('/api/users/1')
        .set(bearer(ctx.adminToken))
        .send({ role: 'employee' });
      expect(res.status).toBe(400);
    });

    it('rechaza un cuerpo vacío', async () => {
      const res = await request(ctx.app).put('/api/users/2').set(bearer(ctx.adminToken)).send({});
      expect(res.status).toBe(400);
    });

    it('al desactivar un usuario su token deja de funcionar', async () => {
      await request(ctx.app).put('/api/users/2').set(bearer(ctx.adminToken)).send({ active: false });
      const res = await request(ctx.app).get('/api/auth/me').set(bearer(ctx.employeeToken));
      expect(res.status).toBe(401);
    });
  });

  describe('Delete', () => {
    it('elimina un usuario', async () => {
      const del = await request(ctx.app).delete('/api/users/2').set(bearer(ctx.adminToken));
      expect(del.status).toBe(204);

      const get = await request(ctx.app).get('/api/users/2').set(bearer(ctx.adminToken));
      expect(get.status).toBe(404);
    });

    it('un administrador no puede eliminarse a sí mismo', async () => {
      const res = await request(ctx.app).delete('/api/users/1').set(bearer(ctx.adminToken));
      expect(res.status).toBe(400);
    });
  });
});
