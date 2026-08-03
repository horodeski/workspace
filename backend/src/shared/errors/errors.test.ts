import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  RateLimitError,
  PayloadTooLargeError,
} from './index.js';

describe('AppError', () => {
  it('should create an AppError with correct properties', () => {
    const error = new AppError(400, 'Bad Request', 'Something went wrong');
    expect(error.statusCode).toBe(400);
    expect(error.error).toBe('Bad Request');
    expect(error.message).toBe('Something went wrong');
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should support optional details', () => {
    const details = [{ path: 'email', message: 'Invalid email', code: 'invalid_string' }];
    const error = new AppError(400, 'Bad Request', 'Validation failed', details);
    expect(error.details).toEqual(details);
  });
});

describe('NotFoundError', () => {
  it('should create a 404 error with resource name', () => {
    const error = new NotFoundError('Atividade');
    expect(error.statusCode).toBe(404);
    expect(error.error).toBe('Not Found');
    expect(error.message).toBe('Atividade não encontrado');
    expect(error.name).toBe('NotFoundError');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ConflictError', () => {
  it('should create a 409 error with custom message', () => {
    const error = new ConflictError('Email já cadastrado');
    expect(error.statusCode).toBe(409);
    expect(error.error).toBe('Conflict');
    expect(error.message).toBe('Email já cadastrado');
    expect(error.name).toBe('ConflictError');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('should create a 400 error with validation details', () => {
    const details = [
      { path: 'title', message: 'Required', code: 'invalid_type' },
      { path: 'date', message: 'Invalid date format', code: 'invalid_string' },
    ];
    const error = new ValidationError(details);
    expect(error.statusCode).toBe(400);
    expect(error.error).toBe('Bad Request');
    expect(error.message).toBe('Erro de validação');
    expect(error.details).toEqual(details);
    expect(error.name).toBe('ValidationError');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('UnauthorizedError', () => {
  it('should create a 401 error with default message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.error).toBe('Unauthorized');
    expect(error.message).toBe('Não autorizado');
    expect(error.name).toBe('UnauthorizedError');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should accept a custom message', () => {
    const error = new UnauthorizedError('Token expirado');
    expect(error.message).toBe('Token expirado');
  });
});

describe('RateLimitError', () => {
  it('should create a 429 error with retryAfter', () => {
    const error = new RateLimitError(60);
    expect(error.statusCode).toBe(429);
    expect(error.error).toBe('Too Many Requests');
    expect(error.message).toBe('Limite de requisições excedido');
    expect(error.retryAfter).toBe(60);
    expect(error.name).toBe('RateLimitError');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('PayloadTooLargeError', () => {
  it('should create a 413 error with max size in message', () => {
    const error = new PayloadTooLargeError('10MB');
    expect(error.statusCode).toBe(413);
    expect(error.error).toBe('Payload Too Large');
    expect(error.message).toBe('Arquivo excede o limite de 10MB');
    expect(error.name).toBe('PayloadTooLargeError');
    expect(error).toBeInstanceOf(AppError);
  });
});
