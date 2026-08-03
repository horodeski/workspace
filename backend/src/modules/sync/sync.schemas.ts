import { z } from 'zod';

// UUID v4 regex for validating provided IDs
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const optionalUuid = z.string().regex(uuidRegex, 'ID deve ser um UUID válido').optional();

// --- Activity schema ---
const activityImportSchema = z.object({
  id: optionalUuid,
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:mm')
    .nullable()
    .optional()
    .default(null),
  duration: z.number().int().positive().nullable().optional().default(null),
  recurrence: z
    .enum(['none', 'daily', 'weekday', 'weekly', 'monthly'])
    .optional()
    .default('none'),
  priority: z
    .enum(['low', 'medium', 'high'])
    .nullable()
    .optional()
    .default(null),
});

// --- Support entry schema ---
const supportEntryImportSchema = z.object({
  id: optionalUuid,
  date: z.string().min(1).max(5),
  description: z.string().min(1).max(200),
  duration: z.string().min(1).max(20),
  observation: z.string().max(300).optional().default(''),
});

// --- Board item schema ---
const boardItemImportSchema = z.object({
  id: optionalUuid,
  content: z.string().min(1).max(500),
  type: z.enum(['quote', 'image', 'link', 'note']),
  position: z
    .object({
      x: z.number().int().min(0).default(0),
      y: z.number().int().min(0).default(0),
    })
    .optional()
    .default({ x: 0, y: 0 }),
  size: z
    .object({
      width: z.number().int().positive().default(240),
      height: z.number().int().positive().default(180),
    })
    .optional()
    .default({ width: 240, height: 180 }),
});

// --- Board schema ---
const boardImportSchema = z.object({
  id: optionalUuid,
  name: z.string().min(1).max(50),
  items: z.array(boardItemImportSchema).optional().default([]),
});

// --- Review schema ---
const reviewImportSchema = z.object({
  id: optionalUuid,
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2000).max(2100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  learning: z.string().optional().default(''),
  decisions: z.string().optional().default(''),
  resolvedProblems: z.string().optional().default(''),
  timeWaste: z.string().optional().default(''),
  nextWeekFocus: z.string().optional().default(''),
});

// --- Main import schema ---
export const localStorageImportSchema = z.object({
  activities: z.array(activityImportSchema).optional().default([]),
  supportEntries: z.array(supportEntryImportSchema).optional().default([]),
  boards: z.array(boardImportSchema).optional().default([]),
  reviews: z.array(reviewImportSchema).optional().default([]),
});

export type LocalStorageImportInput = z.infer<typeof localStorageImportSchema>;
export type ActivityImport = z.infer<typeof activityImportSchema>;
export type SupportEntryImport = z.infer<typeof supportEntryImportSchema>;
export type BoardImport = z.infer<typeof boardImportSchema>;
export type BoardItemImport = z.infer<typeof boardItemImportSchema>;
export type ReviewImport = z.infer<typeof reviewImportSchema>;

// --- Offline push schemas ---

const offlineOperationSchema = z.object({
  id: z.string().regex(uuidRegex, 'ID da operação deve ser um UUID válido'),
  entity: z.enum(['activity', 'support-entry', 'board', 'board-item', 'review']),
  action: z.enum(['create', 'update', 'delete']),
  data: z.unknown(),
  timestamp: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'timestamp deve ser uma data ISO 8601 válida'
    ),
});

export const syncPushSchema = z.object({
  operations: z
    .array(offlineOperationSchema)
    .min(1, 'Pelo menos uma operação é necessária')
    .max(100, 'Máximo de 100 operações por requisição'),
});

export type OfflineOperation = z.infer<typeof offlineOperationSchema>;
export type SyncPushInput = z.infer<typeof syncPushSchema>;
