import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(128, 'A senha deve ter no máximo 128 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
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

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d{6}$/, 'Código deve conter apenas números'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
