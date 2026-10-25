export type Role = 'admin' | 'employee';

export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Celulares',
  'Monitores',
  'Componentes',
  'Accesorios',
  'Audio',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role: Role;
  active: boolean;
}

export interface ProductDTO {
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

export interface ProductInput {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
}

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  byCategory: { category: ProductCategory; products: number; units: number }[];
}
