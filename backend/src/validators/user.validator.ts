import { z } from 'zod';
import { ROLES } from '../models/user.model.js';

const name = z
  .string({ error: 'El nombre es obligatorio' })
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(80, 'El nombre no puede superar 80 caracteres');

const email = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .pipe(z.email('El correo no es válido'));

const password = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe tener al menos un número');

const role = z.enum(ROLES, { error: 'El rol debe ser "admin" o "employee"' });

export const createUserSchema = z.object({
  name,
  email,
  password,
  role: role.default('employee'),
  active: z.boolean().default(true),
});

export const updateUserSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    password: password.optional(),
    role: role.optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar');

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
