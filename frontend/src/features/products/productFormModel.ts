import { Validator, rules } from '../../core/validation/Validator';
import type { Product } from '../../models/Product';
import type { ProductCategory, ProductInput } from '../../models/types';

export interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory | '';
  price: string;
  stock: string;
  minStock: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '0',
  minStock: '5',
};

export const productValidator = new Validator<ProductFormValues>()
  .field(
    'sku',
    rules.required('El SKU es obligatorio'),
    rules.pattern(/^[A-Za-z0-9-]{3,20}$/, 'De 3 a 20 caracteres: letras, números o guiones'),
  )
  .field('name', rules.required('El nombre es obligatorio'), rules.minLength(2), rules.maxLength(120))
  .field('description', rules.maxLength(500))
  .field('category', rules.required('Selecciona una categoría'))
  .field('price', rules.required('El precio es obligatorio'), rules.number(), rules.greaterThan(0, 'El precio debe ser mayor que 0'))
  .field('stock', rules.required('Indica el stock'), rules.number(), rules.integer(), rules.min(0, 'No puede ser negativo'))
  .field('minStock', rules.required('Indica el stock mínimo'), rules.number(), rules.integer(), rules.min(0, 'No puede ser negativo'));

export function productToFormValues(product: Product): ProductFormValues {
  const input = product.toInput();
  return {
    ...input,
    price: String(input.price),
    stock: String(input.stock),
    minStock: String(input.minStock),
  };
}

export function formValuesToProductInput(values: ProductFormValues): ProductInput {
  return {
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category as ProductCategory,
    price: Number(values.price),
    stock: Number(values.stock),
    minStock: Number(values.minStock),
  };
}
