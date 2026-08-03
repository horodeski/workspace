import { z } from 'zod';

// --- Shared field schemas ---

const boardNameSchema = z
  .string()
  .min(1, 'O nome é obrigatório')
  .max(50, 'O nome deve ter no máximo 50 caracteres')
  .transform((n) => n.trim())
  .pipe(z.string().min(1, 'O nome não pode ser apenas espaços em branco'));

const boardItemContentSchema = z
  .string()
  .min(1, 'O conteúdo é obrigatório')
  .max(500, 'O conteúdo deve ter no máximo 500 caracteres')
  .transform((c) => c.trim())
  .pipe(z.string().min(1, 'O conteúdo não pode ser apenas espaços em branco'));

const boardItemTypeSchema = z.enum(['quote', 'image', 'link', 'note'], {
  errorMap: () => ({ message: 'Tipo inválido. Deve ser: quote, image, link ou note' }),
});

const positionSchema = z.object({
  x: z.number().int('A posição X deve ser um número inteiro').min(0, 'A posição X deve ser >= 0'),
  y: z.number().int('A posição Y deve ser um número inteiro').min(0, 'A posição Y deve ser >= 0'),
});

const sizeSchema = z.object({
  width: z
    .number()
    .int('A largura deve ser um número inteiro')
    .positive('A largura deve ser um número positivo'),
  height: z
    .number()
    .int('A altura deve ser um número inteiro')
    .positive('A altura deve ser um número positivo'),
});

// --- Request schemas ---

export const createBoardSchema = z.object({
  name: boardNameSchema,
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const renameBoardSchema = z.object({
  name: boardNameSchema,
});

export type RenameBoardInput = z.infer<typeof renameBoardSchema>;

export const createItemSchema = z.object({
  content: boardItemContentSchema,
  type: boardItemTypeSchema,
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  content: boardItemContentSchema,
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const updatePositionSchema = positionSchema;

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

export const updateSizeSchema = sizeSchema;

export type UpdateSizeInput = z.infer<typeof updateSizeSchema>;

export const batchUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'O id do item é obrigatório'),
        position: positionSchema.optional(),
        size: sizeSchema.optional(),
      }),
    )
    .min(1, 'É necessário informar ao menos um item')
    .max(50, 'Máximo de 50 itens por atualização em lote'),
});

export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;

export const boardItemQuerySchema = z.object({
  filter: z
    .object({
      type: boardItemTypeSchema.optional(),
    })
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type BoardItemQueryInput = z.infer<typeof boardItemQuerySchema>;
