import { z } from 'zod';

export type BoardItemType = 'quote' | 'image' | 'link' | 'note';

export type BoardFilter = 'all' | BoardItemType;

export interface BoardItemPosition {
  x: number; // pixels from canvas left edge
  y: number; // pixels from canvas top edge
}

export interface BoardItemSize {
  width: number; // pixels, min 120, max 800
  height: number; // pixels, min 80, max 600
}

export interface BoardItem {
  id: string; // UUID v4
  content: string; // 1-500 characters, trimmed
  type: BoardItemType;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  position: BoardItemPosition;
  size: BoardItemSize;
}

export interface Board {
  id: string; // UUID v4
  name: string; // 1-50 chars, trimmed
  items: BoardItem[];
  createdAt: string; // ISO 8601
}

export interface PersistedBoardModuleState {
  boards: Board[];
  activeBoardId: string | null;
}

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
