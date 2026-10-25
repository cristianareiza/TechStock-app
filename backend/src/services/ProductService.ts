import type { Paginated, Product, ProductStats } from '../models/product.model.js';
import type { ProductRepository } from '../repositories/ProductRepository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
} from '../validators/product.validator.js';

export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  list(query: ProductQuery): Paginated<Product> {
    const { items, total } = this.products.findAll(query);
    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  getById(id: number): Product {
    const product = this.products.findById(id);
    if (!product) throw AppError.notFound('Producto');
    return product;
  }

  create(input: CreateProductInput, createdBy: number): Product {
    if (this.products.existsBySku(input.sku)) {
      throw AppError.conflict(`Ya existe un producto con el SKU ${input.sku}`);
    }
    return this.products.create({ ...input, createdBy });
  }

  update(id: number, input: UpdateProductInput): Product {
    this.getById(id);
    if (input.sku && this.products.existsBySku(input.sku, id)) {
      throw AppError.conflict(`Ya existe un producto con el SKU ${input.sku}`);
    }
    return this.products.update(id, input)!;
  }

  delete(id: number): void {
    this.getById(id);
    this.products.delete(id);
  }

  getStats(): ProductStats {
    return this.products.getStats();
  }
}
