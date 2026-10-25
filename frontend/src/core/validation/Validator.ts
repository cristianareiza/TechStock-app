export type Rule<T> = (value: string, values: T) => string | null;

export class Validator<T extends object> {
  private readonly fields = new Map<keyof T, Rule<T>[]>();

  field(name: keyof T, ...fieldRules: Rule<T>[]): this {
    this.fields.set(name, fieldRules);
    return this;
  }

  validate(values: T): Partial<Record<keyof T, string>> {
    const errors: Partial<Record<keyof T, string>> = {};
    for (const [name, fieldRules] of this.fields) {
      const raw = values[name];
      const value = typeof raw === 'string' ? raw.trim() : String(raw ?? '');
      for (const rule of fieldRules) {
        const message = rule(value, values);
        if (message) {
          errors[name] = message;
          break;
        }
      }
    }
    return errors;
  }
}

export const rules = {
  required:
    <T>(message = 'Este campo es obligatorio'): Rule<T> =>
    (value) =>
      value === '' ? message : null,

  minLength:
    <T>(min: number, message?: string): Rule<T> =>
    (value) =>
      value !== '' && value.length < min ? (message ?? `Debe tener al menos ${min} caracteres`) : null,

  maxLength:
    <T>(max: number, message?: string): Rule<T> =>
    (value) =>
      value.length > max ? (message ?? `No puede superar ${max} caracteres`) : null,

  pattern:
    <T>(regex: RegExp, message: string): Rule<T> =>
    (value) =>
      value !== '' && !regex.test(value) ? message : null,

  email: <T>(message = 'Ingresa un correo válido'): Rule<T> =>
    rules.pattern<T>(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message),

  number:
    <T>(message = 'Debe ser un número'): Rule<T> =>
    (value) =>
      value !== '' && Number.isNaN(Number(value)) ? message : null,

  integer:
    <T>(message = 'Debe ser un número entero'): Rule<T> =>
    (value) =>
      value !== '' && !Number.isInteger(Number(value)) ? message : null,

  min:
    <T>(min: number, message?: string): Rule<T> =>
    (value) =>
      value !== '' && Number(value) < min ? (message ?? `Debe ser mayor o igual a ${min}`) : null,

  greaterThan:
    <T>(limit: number, message?: string): Rule<T> =>
    (value) =>
      value !== '' && Number(value) <= limit ? (message ?? `Debe ser mayor que ${limit}`) : null,
};
