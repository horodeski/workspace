import { formatJournalEntry } from './formatJournalEntry';

describe('formatJournalEntry', () => {
  it('should format simple text into professional format with header and bullet points', async () => {
    const input = 'fiz code review no PR do joao';
    const result = await formatJournalEntry(input);

    expect(result).toContain('## Atividades realizadas');
    expect(result).toContain('• Fiz code review no PR do joao');
  });

  it('should format multiline text with bullet points for each line', async () => {
    const input = 'resolvi bug no login\natualizei dependencias\nfiz deploy';
    const result = await formatJournalEntry(input);

    expect(result).toContain('## Atividades realizadas');
    expect(result).toContain('• Resolvi bug no login');
    expect(result).toContain('• Atualizei dependencias');
    expect(result).toContain('• Fiz deploy');
  });

  it('should preserve existing bullet points without duplicating', async () => {
    const input = '- already has bullet';
    const result = await formatJournalEntry(input);

    expect(result).not.toContain('• - already has bullet');
    expect(result).toContain('- already has bullet');
  });

  it('should return the same output for the same input (referential transparency)', async () => {
    const input = 'trabalhei na feature de relatórios';
    const result1 = await formatJournalEntry(input);
    const result2 = await formatJournalEntry(input);

    expect(result1).toBe(result2);
  });

  it('should always return non-empty output for non-empty input', async () => {
    const input = 'a';
    const result = await formatJournalEntry(input);

    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty lines within the text', async () => {
    const input = 'primeiro item\n\nsegundo item';
    const result = await formatJournalEntry(input);

    expect(result).toContain('• Primeiro item');
    expect(result).toContain('• Segundo item');
  });
});
