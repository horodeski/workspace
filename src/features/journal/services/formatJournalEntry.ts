/**
 * formatJournalEntry - Mock assíncrono do Formatador_Journal
 *
 * Função pura síncrona envolvida em Promise.resolve() que transforma
 * texto livre em linguagem profissional. Interface assíncrona preparada
 * para substituição futura por chamada à API OpenAI.
 *
 * Regras:
 * - Aceita string não vazia
 * - Retorna string formatada em linguagem profissional
 * - Sem efeitos colaterais
 * - Sem dependências externas
 * - Mesma entrada sempre produz mesma saída (transparência referencial)
 */

function capitalizeSentence(sentence: string): string {
  const trimmed = sentence.trimStart();
  if (trimmed.length === 0) return sentence;

  const leadingSpaces = sentence.length - trimmed.length;
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return sentence.slice(0, leadingSpaces) + capitalized;
}

function formatText(rawText: string): string {
  const lines = rawText.split('\n');

  const formattedLines = lines.map((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      return '';
    }

    // Capitalize first letter of the line
    const capitalized = capitalizeSentence(trimmedLine);

    // Add bullet point prefix if the line doesn't already have one
    if (capitalized.startsWith('- ') || capitalized.startsWith('• ')) {
      return capitalized;
    }

    return `• ${capitalized}`;
  });

  const header = '## Atividades realizadas\n';
  const body = formattedLines.join('\n');

  return `${header}\n${body}`;
}

export async function formatJournalEntry(rawText: string): Promise<string> {
  return Promise.resolve(formatText(rawText));
}
