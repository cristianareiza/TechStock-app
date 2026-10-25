import type { DB, SqlParams } from '../database/connection.js';
import type {
  CreateProductData,
  Product,
  ProductCategory,
  ProductFilters,
  ProductSortField,
  ProductStats,
  UpdateProductData,
} from '../models/product.model.js';

interface ProductRow {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  min_stock: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

const COLUMN_MAP: Record<keyof UpdateProductData, string> = {
  sku: 'sku',
  name: 'name',
  description: 'description',
  category: 'category',
  price: 'price',
  stock: 'stock',
  minStock: 'min_stock',
};

// solo se puede ordenar por estas columnas
const SORT_COLUMNS: Record<ProductSortField, string> = {
  name: 'name COLLATE NOCASE',
  price: 'price',
  stock: 'stock',
  createdAt: 'created_at',
};

export class ProductRepository {
  constructor(private readonly db: DB) {}

  findAll(filters: ProductFilters): { items: Product[]; total: number } {
    const conditions: string[] = [];
    const params: SqlParams = {};

    if (filters.search) {
      conditions.push('(name LIKE @search OR sku LIKE @search OR description LIKE @search)');
      params.search = `%${filters.search}%`;
    }
    if (filters.category) {
      conditions.push('category = @category');
      params.category = filters.category;
    }
    if (filters.lowStock) {
      conditions.push('stock <= min_stock');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = `${SORT_COLUMNS[filters.sort]} ${filters.order === 'asc' ? 'ASC' : 'DESC'}, id DESC`;

    const { total } = this.db
      .prepare(`SELECT COUNT(*) AS total FROM products ${where}`)
      .get(params) as unknown as { total: number };

    const rows = this.db
      .prepare(`SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: filters.limit, offset: (filters.page - 1) * filters.limit }) as unknown as ProductRow[];

    return { items: rows.map((row) => this.toProduct(row)), total };
  }

  findById(id: number): Product | undefined {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow | undefined;
    return row ? this.toProduct(row) : undefined;
  }

  existsBySku(sku: string, excludeId?: number): boolean {
    return (
      this.db.prepare('SELECT 1 FROM products WHERE sku = ? AND id != ?').get(sku, excludeId ?? 0) !==
      undefined
    );
  }

  create(data: CreateProductData): Product {
    const result = this.db
      .prepare(
        `INSERT INTO products (sku, name, description, category, price, stock, min_stock, created_by)
         VALUES (@sku, @name, @description, @category, @price, @stock, @minStock, @createdBy)`,
      )
      .run({ ...data, createdBy: data.createdBy ?? null } as unknown as SqlParams);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, data: UpdateProductData): Product | undefined {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined) as [
      keyof UpdateProductData,
      unknown,
    ][];

    if (entries.length > 0) {
      const assignments = entries.map(([key]) => `${COLUMN_MAP[key]} = @${key}`).join(', ');
      this.db
        .prepare(`UPDATE products SET ${assignments}, updated_at = datetime('now') WHERE id = @id`)
        .run({ ...Object.fromEntries(entries), id } as SqlParams);
    }

    return this.findById(id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
  }

  getStats(): ProductStats {
    const totals = this.db
      .prepare(
        `SELECT
           COUNT(*)                                          AS totalProducts,
           COALESCE(SUM(stock), 0)                           AS totalUnits,
           COALESCE(SUM(price * stock), 0)                   AS inventoryValue,
           COALESCE(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END), 0) AS lowStockCount,
           COALESCE(SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END), 0)          AS outOfStockCount
         FROM products`,
      )
      .get() as unknown as Omit<ProductStats, 'byCategory'>;

    const byCategory = this.db
      .prepare(
        `SELECT category, COUNT(*) AS products, COALESCE(SUM(stock), 0) AS units
         FROM products GROUP BY category ORDER BY units DESC, category ASC`,
      )
      .all() as unknown as ProductStats['byCategory'];

    return { ...totals, byCategory };
  }

  private toProduct(row: ProductRow): Product {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      stock: row.stock,
      minStock: row.min_stock,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
