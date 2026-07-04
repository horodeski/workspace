import { z } from 'zod';

export type EventStatus = 'pending' | 'in-progress' | 'completed';

export type EventCategory = 'work' | 'personal' | 'health' | 'meeting' | 'other';

export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarEventType {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  category: EventCategory;
  color: string; // Hex color
  status: EventStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CalendarState {
  selectedDate: Date;
  viewMode: ViewMode;
  isExpanded: boolean;
  selectedEvent: CalendarEventType | null;
  isDrawerOpen: boolean;
  events: CalendarEventType[];
}

export const calendarEventSchema = z.object({
  title: z
    .string()
    .min(1, 'O título é obrigatório')
    .max(100, 'O título deve ter no máximo 100 caracteres')
    .refine((val) => val.trim().length > 0, 'O título não pode conter apenas espaços'),
  description: z.string().max(500, 'A descrição deve ter no máximo 500 caracteres').default(''),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  category: z.enum(['work', 'personal', 'health', 'meeting', 'other']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  status: z.enum(['pending', 'in-progress', 'completed']),
});

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;
