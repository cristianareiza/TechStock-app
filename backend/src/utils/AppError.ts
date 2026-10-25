export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new AppError(401, message);
  }

  static forbidden(message = 'No tienes permisos para realizar esta acción') {
    return new AppError(403, message);
  }

  static notFound(resource = 'Recurso') {
    return new AppError(404, `${resource} no encontrado`);
  }

  static conflict(message: string) {
    return new AppError(409, message);
  }
}
