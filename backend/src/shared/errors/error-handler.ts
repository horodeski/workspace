import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, type ErrorResponse, type ValidationDetail } from './app-error.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Handle AppError instances
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      statusCode: error.statusCode,
      error: error.error,
      message: error.message,
    };
    if (error.details) {
      response.details = error.details;
    }
    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle Fastify errors with statusCode (e.g., rate-limit 429, payload too large 413)
  if ('statusCode' in error && typeof (error as any).statusCode === 'number' && (error as any).statusCode !== 500) {
    const statusCode = (error as any).statusCode as number;
    const response: ErrorResponse = {
      statusCode,
      error: (error as any).error || error.message || 'Error',
      message: error.message || 'Erro na requisição',
    };
    reply.status(statusCode).send(response);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details: ValidationDetail[] = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    const response: ErrorResponse = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Erro de validação',
      details,
    };
    reply.status(400).send(response);
    return;
  }

  // Handle Fastify validation errors (from schema validation)
  if ('validation' in error && Array.isArray((error as any).validation)) {
    const validation = (error as any).validation as Array<{
      instancePath?: string;
      params?: { missingProperty?: string };
      message?: string;
      keyword?: string;
    }>;
    const details: ValidationDetail[] = validation.map((v) => ({
      path: v.instancePath?.replace(/^\//, '').replace(/\//g, '.') || v.params?.missingProperty || '',
      message: v.message || 'Valor inválido',
      code: v.keyword || 'validation',
    }));
    const response: ErrorResponse = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Erro de validação',
      details,
    };
    reply.status(400).send(response);
    return;
  }

  // Generic 500 error — log full details, return safe response
  request.log.error({ err: error, stack: error.stack }, 'Unhandled error');
  const response: ErrorResponse = {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Erro interno do servidor',
  };
  reply.status(500).send(response);
}
