import type { User } from '../models/user.model.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import type { CreateUserInput, UpdateUserInput } from '../validators/user.validator.js';

export class UserService {
  constructor(private readonly users: UserRepository) {}

  list(): User[] {
    return this.users.findAll();
  }

  getById(id: number): User {
    const user = this.users.findById(id);
    if (!user) throw AppError.notFound('Usuario');
    return user;
  }

  async create(input: CreateUserInput): Promise<User> {
    if (this.users.existsByEmail(input.email)) {
      throw AppError.conflict('Ya existe un usuario con ese correo');
    }
    const { password, ...rest } = input;
    return this.users.create({ ...rest, passwordHash: await hashPassword(password) });
  }

  async update(id: number, input: UpdateUserInput, currentUserId: number): Promise<User> {
    const existing = this.getById(id);

    if (input.email && this.users.existsByEmail(input.email, id)) {
      throw AppError.conflict('Ya existe un usuario con ese correo');
    }

    const losesAdmin =
      existing.role === 'admin' && existing.active && (input.role === 'employee' || input.active === false);
    if (losesAdmin && this.users.countActiveAdmins() <= 1) {
      throw AppError.badRequest('Debe existir al menos un administrador activo');
    }
    if (id === currentUserId && input.active === false) {
      throw AppError.badRequest('No puedes desactivar tu propia cuenta');
    }

    const { password, ...rest } = input;
    const passwordHash = password ? await hashPassword(password) : undefined;
    return this.users.update(id, { ...rest, passwordHash })!;
  }

  delete(id: number, currentUserId: number): void {
    if (id === currentUserId) {
      throw AppError.badRequest('No puedes eliminar tu propia cuenta');
    }
    const user = this.getById(id);
    if (user.role === 'admin' && user.active && this.users.countActiveAdmins() <= 1) {
      throw AppError.badRequest('No se puede eliminar el último administrador');
    }
    this.users.delete(id);
  }
}
