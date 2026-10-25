import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isTest } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Datos inválidos',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.') || null,
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // JSON mal escrito en el body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'El cuerpo de la petición no es un JSON válido' } });
    return;
  }

  if (!isTest) console.error('[error]', err);
  res.status(500).json({ error: { message: 'Error interno del servidor' } });
}
