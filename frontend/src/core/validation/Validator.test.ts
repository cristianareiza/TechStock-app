import { describe, expect, it } from 'vitest';
import { productValidator, formValuesToProductInput, EMPTY_PRODUCT_FORM } from '../../features/products/productFormModel';
import { createUserValidator } from '../../features/users/userFormModel';
import { Validator, rules } from './Validator';

describe('Validator', () => {
  it('devuelve el primer error de cada campo', () => {
    const validator = new Validator<{ email: string }>().field('email', rules.required(), rules.email());
    expect(validator.validate({ email: '' })).toEqual({ email: 'Este campo es obligatorio' });
    expect(validator.validate({ email: 'malo' })).toEqual({ email: 'Ingresa un correo válido' });
    expect(validator.validate({ email: 'ok@correo.com' })).toEqual({});
  });
});

describe('validación del formulario de productos', () => {
  const valid = {
    ...EMPTY_PRODUCT_FORM,
    sku: 'aud-001',
    name: 'Audífonos',
    category: 'Audio' as const,
    price: '150000',
  };

  it('acepta un producto válido', () => {
    expect(productValidator.validate(valid)).toEqual({});
  });

  it('detecta campos obligatorios vacíos', () => {
    const errors = productValidator.validate(EMPTY_PRODUCT_FORM);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['sku', 'name', 'category', 'price']));
  });

  it('rechaza precio cero, stock decimal y stock negativo', () => {
    const errors = productValidator.validate({ ...valid, price: '0', stock: '2.5', minStock: '-1' });
    expect(errors.price).toBe('El precio debe ser mayor que 0');
    expect(errors.stock).toBe('Debe ser un número entero');
    expect(errors.minStock).toBe('No puede ser negativo');
  });

  it('convierte los valores al formato de la API', () => {
    expect(formValuesToProductInput(valid)).toEqual({
      sku: 'AUD-001',
      name: 'Audífonos',
      description: '',
      category: 'Audio',
      price: 150000,
      stock: 0,
      minStock: 5,
    });
  });
});

describe('validación del formulario de usuarios', () => {
  const base = { name: 'Ana Ruiz', email: 'ana@correo.com', password: '', role: 'employee' as const, active: true };

  it('exige contraseña al crear pero no al editar', () => {
    expect(createUserValidator('create').validate(base).password).toBe('La contraseña es obligatoria');
    expect(createUserValidator('edit').validate(base)).toEqual({});
  });

  it('exige mayúscula y número en la contraseña', () => {
    const validator = createUserValidator('create');
    expect(validator.validate({ ...base, password: 'sinmayus1' }).password).toMatch(/mayúscula/);
    expect(validator.validate({ ...base, password: 'SinNumero' }).password).toMatch(/número/);
    expect(validator.validate({ ...base, password: 'Valida123' })).toEqual({});
  });
});
