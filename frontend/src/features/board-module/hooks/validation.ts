import { z } from 'zod';

import {
  BOARD_NAME_MIN_LENGTH,
  BOARD_NAME_MAX_LENGTH,
} from '../constants';

const ITEM_CONTENT_MIN_LENGTH = 1;
const ITEM_CONTENT_MAX_LENGTH = 500;

export const boardNameSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length >= BOARD_NAME_MIN_LENGTH, {
    message: 'O nome é obrigatório',
  })
  .refine((val) => val.length <= BOARD_NAME_MAX_LENGTH, {
    message: 'O nome deve ter no máximo 50 caracteres',
  });

export const itemContentSchema = z
  .string()
  .refine((val) => val.length >= ITEM_CONTENT_MIN_LENGTH, {
    message: 'O conteúdo é obrigatório',
  })
  .refine((val) => val.length <= ITEM_CONTENT_MAX_LENGTH, {
    message: 'O conteúdo deve ter no máximo 500 caracteres',
  });

export function validateBoardName(name: string): {
  success: boolean;
  error?: string;
} {
  const result = boardNameSchema.safeParse(name);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.issues[0].message };
}

export function validateItemContent(content: string): {
  success: boolean;
  error?: string;
} {
  const result = itemContentSchema.safeParse(content);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.issues[0].message };
}
