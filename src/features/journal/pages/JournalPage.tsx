import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { JournalEditor } from '../components/JournalEditor';
import { JournalCard } from '../components/JournalCard';
import { useJournalStore } from '../hooks/useJournalStore';
import { formatJournalEntry } from '../services/formatJournalEntry';

export const JournalPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { entries, addEntry } = useJournalStore();

  const handleSave = async (text: string) => {
    setIsLoading(true);
    try {
      const formattedText = await formatJournalEntry(text);
      addEntry(text, formattedText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Journal"
        description="Registre o que você fez hoje"
      />

      <JournalEditor onSave={handleSave} isLoading={isLoading} />

      {entries.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Nenhuma entrada registrada"
          description="Comece registrando o que você fez hoje. Suas entradas serão formatadas automaticamente."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <JournalCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
};
