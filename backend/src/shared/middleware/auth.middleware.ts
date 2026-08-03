import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/errors.js';

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

export async function authMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acesso não fornecido');
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    const secret = (request.server as any).env.JWT_SECRET;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    request.userId = decoded.userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token de acesso expirado');
    }
    throw new UnauthorizedError('Token de acesso inválido');
  }
}
