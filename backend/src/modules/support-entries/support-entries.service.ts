import { supportEntriesRepository } from './support-entries.repository.js';
import type { CreateSupportEntryInput, UpdateSupportEntryInput } from './support-entries.schemas.js';
import type { SupportEntryRecord, SupportEntryWithAttachments } from './support-entries.repository.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { eventBus } from '../../shared/event-bus/index.js';

function generateFormattedText(entries: SupportEntryWithAttachments[]): string {
  if (entries.length === 0) return '';

  return entries
    .map((entry) => {
      let text = `**${entry.date} - ${entry.duration}.**\n${entry.description}.`;
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
}

async function create(userId: string, data: CreateSupportEntryInput): Promise<SupportEntryRecord> {
  return supportEntriesRepository.create(userId, data);
}

async function listActive(userId: string): Promise<SupportEntryRecord[]> {
  return supportEntriesRepository.findActiveByUserId(userId);
}

async function deleteEntry(userId: string, id: string): Promise<void> {
  const entry = await supportEntriesRepository.findById(id, userId);

  if (!entry) {
    throw new NotFoundError('Entrada de apoio');
  }

  await supportEntriesRepository.softDelete(id, userId);
}

async function updateEntry(userId: string, id: string, data: UpdateSupportEntryInput): Promise<SupportEntryRecord> {
  const entry = await supportEntriesRepository.findById(id, userId);

  if (!entry) {
    throw new NotFoundError('Entrada de apoio');
  }

  const updated = await supportEntriesRepository.update(id, userId, data);

  if (!updated) {
    throw new NotFoundError('Entrada de apoio');
  }

  return updated;
}

async function getFormattedText(userId: string): Promise<string> {
  const entries = await supportEntriesRepository.findActiveWithAttachments(userId);
  return generateFormattedText(entries);
}

async function clearAll(userId: string): Promise<{ count: number }> {
  const count = await supportEntriesRepository.finalizeAll(userId);

  eventBus.publish({ type: 'support-card.cleared', payload: { userId, count } });

  return { count };
}

export const supportEntriesService = {
  create,
  listActive,
  delete: deleteEntry,
  update: updateEntry,
  getFormattedText,
  clearAll,
};
