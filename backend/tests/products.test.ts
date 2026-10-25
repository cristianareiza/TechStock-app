import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { bearer, setupTestApp, type TestContext } from './helpers.js';

const newProduct = {
  sku: 'tab-sam-001',
  name: 'Tablet Samsung Galaxy Tab S9 FE',
  description: '128 GB, pantalla 10.9"',
  category: 'Accesorios',
  price: 1_899_000,
  stock: 10,
  minStock: 3,
};

describe('CRUD de productos /api/products', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestApp();
  });

  it('requiere autenticación', async () => {
    const res = await request(ctx.app).get('/api/products');
    expect(res.status).toBe(401);
  });

  describe('Create', () => {
    it('crea un producto y normaliza el SKU a mayúsculas', async () => {
      const res = await request(ctx.app)
        .post('/api/products')
        .set(bearer(ctx.employeeToken))
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ ...newProduct, sku: 'TAB-SAM-001', createdBy: 2 });
    });

    it('aplica valores por defecto a los campos opcionales', async () => {
      const res = await request(ctx.app)
        .post('/api/products')
        .set(bearer(ctx.adminToken))
        .send({ sku: 'MIN-001', name: 'Producto mínimo', category: 'Audio', price: 1000 });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ description: '', stock: 0, minStock: 5 });
    });

    it('rechaza SKU duplicado con 409', async () => {
      const res = await request(ctx.app)
        .post('/api/products')
        .set(bearer(ctx.adminToken))
        .send({ ...newProduct, sku: 'LAP-ASUS-001' });
      expect(res.status).toBe(409);
    });

    it('valida precio, stock y categoría', async () => {
      const res = await request(ctx.app)
        .post('/api/products')
        .set(bearer(ctx.adminToken))
        .send({ ...newProduct, price: -5, stock: 2.5, category: 'Juguetes' });

      expect(res.status).toBe(400);
      const fields = res.body.error.details.map((d: { field: string }) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['price', 'stock', 'category']));
    });
  });

  describe('Read', () => {
    it('lista productos paginados', async () => {
      const res = await request(ctx.app)
        .get('/api/products?limit=5&page=2')
        .set(bearer(ctx.employeeToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 14, totalPages: 3 });
    });

    it('filtra por búsqueda de texto', async () => {
      const res = await request(ctx.app).get('/api/products?search=samsung').set(bearer(ctx.adminToken));
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const p of res.body.data) {
        expect(`${p.name} ${p.sku} ${p.description}`.toLowerCase()).toContain('samsung');
      }
    });

    it('filtra por categoría y ordena por precio ascendente', async () => {
      const res = await request(ctx.app)
        .get('/api/products?category=Laptops&sort=price&order=asc')
        .set(bearer(ctx.adminToken));

      const prices = res.body.data.map((p: { price: number }) => p.price);
      expect(res.body.data.every((p: { category: string }) => p.category === 'Laptops')).toBe(true);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('filtra productos con stock bajo', async () => {
      const res = await request(ctx.app).get('/api/products?lowStock=true').set(bearer(ctx.adminToken));
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.every((p: { stock: number; minStock: number }) => p.stock <= p.minStock),
      ).toBe(true);
    });

    it('rechaza parámetros de consulta inválidos', async () => {
      const res = await request(ctx.app).get('/api/products?limit=500').set(bearer(ctx.adminToken));
      expect(res.status).toBe(400);
    });

    it('obtiene un producto por id y 404 si no existe', async () => {
      const ok = await request(ctx.app).get('/api/products/1').set(bearer(ctx.adminToken));
      const missing = await request(ctx.app).get('/api/products/999').set(bearer(ctx.adminToken));
      expect(ok.status).toBe(200);
      expect(missing.status).toBe(404);
    });

    it('devuelve estadísticas del inventario', async () => {
      const res = await request(ctx.app).get('/api/products/stats').set(bearer(ctx.adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.totalProducts).toBe(14);
      expect(res.body.data.outOfStockCount).toBe(1);
      expect(res.body.data.inventoryValue).toBeGreaterThan(0);
      expect(res.body.data.byCategory).toHaveLength(6);
    });
  });

  describe('Update', () => {
    it('actualiza el stock de un producto', async () => {
      const res = await request(ctx.app)
        .put('/api/products/5')
        .set(bearer(ctx.employeeToken))
        .send({ stock: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock).toBe(30);
    });

    it('no permite cambiar el SKU a uno existente', async () => {
      const res = await request(ctx.app)
        .put('/api/products/2')
        .set(bearer(ctx.adminToken))
        .send({ sku: 'LAP-ASUS-001' });
      expect(res.status).toBe(409);
    });

    it('responde 404 al actualizar un producto inexistente', async () => {
      const res = await request(ctx.app)
        .put('/api/products/999')
        .set(bearer(ctx.adminToken))
        .send({ stock: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe('Delete', () => {
    it('un empleado no puede eliminar productos (403)', async () => {
      const res = await request(ctx.app).delete('/api/products/1').set(bearer(ctx.employeeToken));
      expect(res.status).toBe(403);
    });

    it('un administrador elimina un producto', async () => {
      const del = await request(ctx.app).delete('/api/products/1').set(bearer(ctx.adminToken));
      const get = await request(ctx.app).get('/api/products/1').set(bearer(ctx.adminToken));
      expect(del.status).toBe(204);
      expect(get.status).toBe(404);
    });
  });
});
