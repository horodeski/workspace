import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupportEntry, Attachment } from '../types/routine.types';

interface SupportCardState {
  entries: SupportEntry[];
  addEntry: (entry: Omit<SupportEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  addAttachment: (entryId: string, attachment: Omit<Attachment, 'id'>) => void;
  removeAttachment: (entryId: string, attachmentId: string) => void;
  clearEntries: () => void;
  getFormattedText: () => string;
  getAllAttachments: () => { entry: SupportEntry; attachment: Attachment }[];
}

export const useSupportCardStore = create<SupportCardState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const newEntry: SupportEntry = {
          ...entry,
          attachments: entry.attachments ?? [],
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
      },

      removeEntry: (id: string) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      addAttachment: (entryId: string, attachment: Omit<Attachment, 'id'>) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  attachments: [
                    ...entry.attachments,
                    { ...attachment, id: crypto.randomUUID() },
                  ],
                }
              : entry
          ),
        }));
      },

      removeAttachment: (entryId: string, attachmentId: string) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  attachments: entry.attachments.filter((a) => a.id !== attachmentId),
                }
              : entry
          ),
        }));
      },

      clearEntries: () => {
        set({ entries: [] });
      },

      getFormattedText: () => {
        const { entries } = get();
        if (entries.length === 0) return '';

        return entries
          .map((entry) => {
            let text = `${entry.date}\n${entry.description} por ${entry.duration}.`;
            if (entry.observation) {
              text += `\n${entry.observation}`;
            }
            if (entry.attachments.length > 0) {
              const names = entry.attachments.map((a) => a.name).join(', ');
              text += `\nAnexos: ${names}`;
            }
            return text;
          })
          .join('\n\n');
      },

      getAllAttachments: () => {
        const { entries } = get();
        const result: { entry: SupportEntry; attachment: Attachment }[] = [];
        for (const entry of entries) {
          for (const attachment of entry.attachments) {
            result.push({ entry, attachment });
          }
        }
        return result;
      },
    }),
    {
      name: 'support-card-storage',
      version: 1,
      migrate: (persistedState: unknown) => {
        const state = persistedState as { entries?: SupportEntry[] };
        return {
          entries: (state.entries ?? []).map((entry) => ({
            ...entry,
            attachments: entry.attachments ?? [],
          })),
        };
      },
    }
  )
);
