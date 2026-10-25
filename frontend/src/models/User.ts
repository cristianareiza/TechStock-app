import { formatDate } from './formatters';
import type { Role, UserDTO } from './types';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  employee: 'Empleado',
};

export class User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly active: boolean;
  readonly createdAt: string;

  constructor(dto: UserDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.email = dto.email;
    this.role = dto.role;
    this.active = dto.active;
    this.createdAt = dto.createdAt;
  }

  static fromDTO(dto: UserDTO): User {
    return new User(dto);
  }

  static roleLabel(role: Role): string {
    return ROLE_LABELS[role];
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get roleLabel(): string {
    return User.roleLabel(this.role);
  }

  get statusLabel(): string {
    return this.active ? 'Activo' : 'Inactivo';
  }

  get firstName(): string {
    return this.name.split(' ')[0];
  }

  get initials(): string {
    return this.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  get memberSince(): string {
    return formatDate(this.createdAt);
  }
}
