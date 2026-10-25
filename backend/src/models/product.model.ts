export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Celulares',
  'Monitores',
  'Componentes',
  'Accesorios',
  'Audio',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
  createdBy?: number | null;
}

export type UpdateProductData = Partial<Omit<CreateProductData, 'createdBy'>>;

export const PRODUCT_SORT_FIELDS = ['name', 'price', 'stock', 'createdAt'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  lowStock?: boolean;
  page: number;
  limit: number;
  sort: ProductSortField;
  order: 'asc' | 'desc';
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  byCategory: { category: ProductCategory; products: number; units: number }[];
}
