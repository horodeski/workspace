import { describe, it, expect, vi } from 'vitest';
import { ZodError, ZodIssueCode } from 'zod';
import { errorHandler } from './error-handler.js';
import { AppError } from './app-error.js';
import { NotFoundError, ValidationError } from './errors.js';

interface MockReply {
  statusCode: number;
  status(code: number): MockReply;
  send: ReturnType<typeof vi.fn>;
}

function createMockReply(): MockReply {
  const reply: MockReply = {
    statusCode: 200,
    status(code: number) {
      reply.statusCode = code;
      return reply;
    },
    send: vi.fn().mockReturnThis(),
  };
  return reply;
}

function createMockRequest() {
  return {
    log: {
      error: vi.fn(),
    },
  } as unknown as Parameters<typeof errorHandler>[1];
}

describe('errorHandler', () => {
  it('should handle AppError and return structured response', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new AppError(400, 'Bad Request', 'Invalid input');

    errorHandler(error as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    expect(reply.statusCode).toBe(400);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid input',
    });
  });

  it('should include details when AppError has them', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const details = [{ path: 'email', message: 'Invalid', code: 'invalid_string' }];
    const error = new ValidationError(details);

    errorHandler(error as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    expect(reply.statusCode).toBe(400);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Erro de validação',
      details,
    });
  });

  it('should handle NotFoundError correctly', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new NotFoundError('Atividade');

    errorHandler(error as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    expect(reply.statusCode).toBe(404);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      message: 'Atividade não encontrado',
    });
  });

  it('should handle ZodError and transform to validation format', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const zodError = new ZodError([
      {
        code: ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'undefined',
        path: ['title'],
        message: 'Required',
      },
      {
        code: ZodIssueCode.too_small,
        minimum: 8,
        type: 'string',
        inclusive: true,
        path: ['password'],
        message: 'String must contain at least 8 character(s)',
      },
    ]);

    errorHandler(zodError as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    expect(reply.statusCode).toBe(400);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Erro de validação',
      details: [
        { path: 'title', message: 'Required', code: 'invalid_type' },
        { path: 'password', message: 'String must contain at least 8 character(s)', code: 'too_small' },
      ],
    });
  });

  it('should handle Fastify validation errors', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = Object.assign(new Error('validation failed'), {
      validation: [
        { instancePath: '/body/email', message: 'must be string', keyword: 'type' },
        { instancePath: '', params: { missingProperty: 'name' }, message: "must have required property 'name'", keyword: 'required' },
      ],
    });

    errorHandler(error as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    expect(reply.statusCode).toBe(400);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Erro de validação',
      details: [
        { path: 'body.email', message: 'must be string', code: 'type' },
        { path: 'name', message: "must have required property 'name'", code: 'required' },
      ],
    });
  });

  it('should handle unknown errors with 500 and log the error', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new Error('Something unexpected happened');

    errorHandler(error as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    expect(reply.statusCode).toBe(500);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor',
    });
    expect(request.log.error).toHaveBeenCalledWith(
      { err: error, stack: error.stack },
      'Unhandled error'
    );
  });

  it('should never expose stack traces in 500 responses', () => {
    const request = createMockRequest();
    const reply = createMockReply();
    const error = new Error('Database connection failed');

    errorHandler(error as unknown as Parameters<typeof errorHandler>[0], request, reply as unknown as Parameters<typeof errorHandler>[2]);

    const sentResponse = reply.send.mock.calls[0][0];
    expect(sentResponse).not.toHaveProperty('stack');
    expect(sentResponse.message).not.toContain('Database');
    expect(sentResponse.message).toBe('Erro interno do servidor');
  });
});
