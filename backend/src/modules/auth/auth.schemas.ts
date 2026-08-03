import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(128, 'A senha deve ter no máximo 128 caracteres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export type RefreshInput = z.infer<typeof refreshSchema>;
