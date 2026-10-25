import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser, User } from '../models/user.model.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { AppError } from '../utils/AppError.js';
import { verifyPassword } from '../utils/password.js';
import type { LoginInput } from '../validators/user.validator.js';

export interface LoginResult {
  token: string;
  user: User;
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const found = this.users.findByEmailWithPassword(email);
    // mismo mensaje para no revelar si el correo existe
    const valid = found ? await verifyPassword(password, found.passwordHash) : false;
    if (!found || !valid) {
      throw AppError.unauthorized('Correo o contraseña incorrectos');
    }
    if (!found.active) {
      throw AppError.forbidden('Tu cuenta está desactivada. Contacta a un administrador');
    }

    const { passwordHash: _omit, ...user } = found;
    return { token: this.generateToken(user), user };
  }

  getProfile(id: number): User {
    const user = this.users.findById(id);
    if (!user) throw AppError.notFound('Usuario');
    return user;
  }

  generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: AuthUser = { id: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
    });
  }

  verifyToken(token: string): AuthUser {
    let payload: AuthUser;
    try {
      payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    } catch {
      throw AppError.unauthorized('Token inválido o expirado');
    }

    const user = this.users.findById(payload.id);
    if (!user || !user.active) {
      throw AppError.unauthorized('La sesión ya no es válida');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
