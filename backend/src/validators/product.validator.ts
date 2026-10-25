import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_SORT_FIELDS } from '../models/product.model.js';

const sku = z
  .string({ error: 'El SKU es obligatorio' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,20}$/, 'El SKU debe tener de 3 a 20 caracteres (letras, números o guiones)');

const name = z
  .string({ error: 'El nombre es obligatorio' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(120, 'El nombre no puede superar 120 caracteres');

const description = z.string().trim().max(500, 'La descripción no puede superar 500 caracteres');

const category = z.enum(PRODUCT_CATEGORIES, { error: 'Categoría no válida' });

const price = z
  .number({ error: 'El precio debe ser un número' })
  .positive('El precio debe ser mayor que 0')
  .max(1_000_000_000, 'El precio es demasiado alto');

const stock = z
  .number({ error: 'El stock debe ser un número' })
  .int('El stock debe ser un número entero')
  .min(0, 'El stock no puede ser negativo');

const minStock = z
  .number({ error: 'El stock mínimo debe ser un número' })
  .int('El stock mínimo debe ser un número entero')
  .min(0, 'El stock mínimo no puede ser negativo');

export const createProductSchema = z.object({
  sku,
  name,
  description: description.default(''),
  category,
  price,
  stock: stock.default(0),
  minStock: minStock.default(5),
});

export const updateProductSchema = z
  .object({
    sku: sku.optional(),
    name: name.optional(),
    description: description.optional(),
    category: category.optional(),
    price: price.optional(),
    stock: stock.optional(),
    minStock: minStock.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar');

export const productQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: category.optional(),
  lowStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(PRODUCT_SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
