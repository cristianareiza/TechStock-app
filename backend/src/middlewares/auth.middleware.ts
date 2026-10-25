import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../models/user.model.js';
import type { AuthService } from '../services/AuthService.js';
import { AppError } from '../utils/AppError.js';

export function authenticate(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Debes iniciar sesión para acceder a este recurso');
    }
    req.user = authService.verifyToken(header.slice(7));
    next();
  };
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
}
