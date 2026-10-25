import { AppError } from './AppError.js';

export function parseId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('El id debe ser un número entero positivo');
  }
  return id;
}
