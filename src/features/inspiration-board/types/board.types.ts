import { z } from 'zod';

export type BoardItemType = 'quote' | 'image' | 'link' | 'note';

export interface BoardItemPosition {
  x: number; // pixels from canvas left edge
  y: number; // pixels from canvas top edge
}

export interface BoardItemSize {
  width: number; // pixels, min 120, max 800
  height: number; // pixels, min 80, max 600
}

export interface BoardItem {
  id: string; // crypto.randomUUID()
  content: string; // 1-500 characters, trimmed
  type: BoardItemType;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  position: BoardItemPosition; // required at runtime, migrated on load
  size: BoardItemSize; // required at runtime, migrated on load
}

export type BoardFilter = 'all' | BoardItemType;

export const boardItemPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
});

export const boardItemSizeSchema = z.object({
  width: z.number().min(120).max(800),
  height: z.number().min(80).max(600),
});

export const boardItemSchema = z.object({
  content: z
    .string()
    .min(1, 'O conteúdo é obrigatório')
    .max(500, 'O conteúdo deve ter no máximo 500 caracteres')
    .refine(
      (val) => val.trim().length > 0,
      'O conteúdo não pode conter apenas espaços'
    ),
  type: z.enum(['quote', 'image', 'link', 'note'], {
    message: 'Selecione um tipo',
  }),
});

export type BoardItemFormData = z.infer<typeof boardItemSchema>;
