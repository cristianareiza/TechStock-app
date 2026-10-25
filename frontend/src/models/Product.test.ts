import { describe, expect, it } from 'vitest';
import { Product } from './Product';
import type { ProductDTO } from './types';

const dto: ProductDTO = {
  id: 1,
  sku: 'LAP-001',
  name: 'Portátil de prueba',
  description: 'Descripción',
  category: 'Laptops',
  price: 2_500_000,
  stock: 10,
  minStock: 3,
  createdBy: 1,
  createdAt: '2026-10-20 15:00:00',
  updatedAt: '2026-10-20 15:00:00',
};

describe('Product (modelo)', () => {
  it('se construye a partir de un DTO', () => {
    const product = Product.fromDTO(dto);
    expect(product).toBeInstanceOf(Product);
    expect(product.sku).toBe('LAP-001');
  });

  it.each([
    [10, 3, 'ok', 'Disponible'],
    [3, 3, 'low', 'Stock bajo'],
    [1, 3, 'low', 'Stock bajo'],
    [0, 3, 'out', 'Agotado'],
  ] as const)('stock %i con mínimo %i -> %s', (stock, minStock, status, label) => {
    const product = new Product({ ...dto, stock, minStock });
    expect(product.stockStatus).toBe(status);
    expect(product.stockLabel).toBe(label);
    expect(product.needsRestock).toBe(status !== 'ok');
  });

  it('calcula el valor del inventario', () => {
    expect(new Product(dto).inventoryValue).toBe(25_000_000);
  });

  it('formatea el precio en pesos colombianos', () => {
    const formatted = new Product(dto).formattedPrice.replace(/\s/g, ' ');
    expect(formatted).toMatch(/\$ ?2\.500\.000/);
  });

  it('toInput devuelve solo los campos editables', () => {
    expect(new Product(dto).toInput()).toEqual({
      sku: 'LAP-001',
      name: 'Portátil de prueba',
      description: 'Descripción',
      category: 'Laptops',
      price: 2_500_000,
      stock: 10,
      minStock: 3,
    });
  });
});
