import { AppError, type ValidationDetail } from './app-error.js';

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'Not Found', `${resource} não encontrado`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'Conflict', message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(details: ValidationDetail[]) {
    super(400, 'Bad Request', 'Erro de validação', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(401, 'Unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  public retryAfter: number;

  constructor(retryAfter: number) {
    super(429, 'Too Many Requests', 'Limite de requisições excedido');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(maxSize: string) {
    super(413, 'Payload Too Large', `Arquivo excede o limite de ${maxSize}`);
    this.name = 'PayloadTooLargeError';
  }
}
