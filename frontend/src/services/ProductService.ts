import { BaseCrudService } from '../core/services/BaseCrudService';
import type { HttpClient } from '../core/http/HttpClient';
import { Product } from '../models/Product';
import type {
  ApiResponse,
  PaginationMeta,
  ProductCategory,
  ProductDTO,
  ProductInput,
  ProductStats,
} from '../models/types';

export type ProductSortField = 'name' | 'price' | 'stock' | 'createdAt';

export interface ProductFilters {
  search?: string;
  category?: ProductCategory | '';
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sort?: ProductSortField;
  order?: 'asc' | 'desc';
}

export interface ProductPage {
  items: Product[];
  meta: PaginationMeta;
}

export class ProductService extends BaseCrudService<Product, ProductDTO, ProductInput> {
  constructor(http: HttpClient) {
    super(http, 'products');
  }

  protected toModel(dto: ProductDTO): Product {
    return Product.fromDTO(dto);
  }

  async search(filters: ProductFilters = {}): Promise<ProductPage> {
    const response = await this.http.get<{ data: ProductDTO[]; meta: PaginationMeta }>(this.resource, {
      ...filters,
      lowStock: filters.lowStock ? 'true' : undefined,
    });
    return { items: response.data.map((dto) => this.toModel(dto)), meta: response.meta };
  }

  async getStats(): Promise<ProductStats> {
    const { data } = await this.http.get<ApiResponse<ProductStats>>(`${this.resource}/stats`);
    return data;
  }
}
