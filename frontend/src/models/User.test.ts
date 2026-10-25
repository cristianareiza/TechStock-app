import { describe, expect, it } from 'vitest';
import { User } from './User';
import type { UserDTO } from './types';

const dto: UserDTO = {
  id: 2,
  name: 'laura gómez ríos',
  email: 'laura@techstock.com',
  role: 'employee',
  active: true,
  createdAt: '2026-10-20 15:00:00',
  updatedAt: '2026-10-20 15:00:00',
};

describe('User (modelo)', () => {
  it('genera las iniciales con máximo dos letras', () => {
    expect(new User(dto).initials).toBe('LG');
  });

  it('expone etiquetas legibles de rol y estado', () => {
    const employee = new User(dto);
    const admin = new User({ ...dto, role: 'admin', active: false });

    expect(employee.roleLabel).toBe('Empleado');
    expect(employee.isAdmin).toBe(false);
    expect(employee.statusLabel).toBe('Activo');
    expect(admin.roleLabel).toBe('Administrador');
    expect(admin.isAdmin).toBe(true);
    expect(admin.statusLabel).toBe('Inactivo');
  });

  it('obtiene el primer nombre', () => {
    expect(new User(dto).firstName).toBe('laura');
  });

  it('formatea la fecha de registro', () => {
    expect(new User(dto).memberSince).toMatch(/2026/);
  });
});
