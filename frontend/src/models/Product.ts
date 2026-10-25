import { formatCurrency } from './formatters';
import type { ProductCategory, ProductDTO, ProductInput } from './types';

export type StockStatus = 'out' | 'low' | 'ok';

const STOCK_LABELS: Record<StockStatus, string> = {
  out: 'Agotado',
  low: 'Stock bajo',
  ok: 'Disponible',
};

export class Product {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly price: number;
  readonly stock: number;
  readonly minStock: number;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(dto: ProductDTO) {
    this.id = dto.id;
    this.sku = dto.sku;
    this.name = dto.name;
    this.description = dto.description;
    this.category = dto.category;
    this.price = dto.price;
    this.stock = dto.stock;
    this.minStock = dto.minStock;
    this.createdAt = dto.createdAt;
    this.updatedAt = dto.updatedAt;
  }

  static fromDTO(dto: ProductDTO): Product {
    return new Product(dto);
  }

  get stockStatus(): StockStatus {
    if (this.stock === 0) return 'out';
    if (this.stock <= this.minStock) return 'low';
    return 'ok';
  }

  get stockLabel(): string {
    return STOCK_LABELS[this.stockStatus];
  }

  get needsRestock(): boolean {
    return this.stockStatus !== 'ok';
  }

  get inventoryValue(): number {
    return this.price * this.stock;
  }

  get formattedPrice(): string {
    return formatCurrency(this.price);
  }

  get formattedInventoryValue(): string {
    return formatCurrency(this.inventoryValue);
  }

  toInput(): ProductInput {
    return {
      sku: this.sku,
      name: this.name,
      description: this.description,
      category: this.category,
      price: this.price,
      stock: this.stock,
      minStock: this.minStock,
    };
  }
}
