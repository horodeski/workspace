import React, { useState } from 'react';
import { Inbox } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Input } from '@/components/Input';
import { InboxItem } from '../components/InboxItem';
import { useInboxStore } from '../hooks/useInboxStore';

export function InboxPage() {
  const [text, setText] = useState('');
  const { tasks, addTask, toggleTask, editTask, removeTask } = useInboxStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      addTask(trimmed);
      setText('');
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Inbox" />

      <div className="mb-6">
        <Input
          placeholder="O que surgiu?"
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Captura rápida de tarefa"
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-12 w-12" />}
          title="Nenhuma tarefa"
          description="Capture tarefas rápidas digitando acima e pressionando Enter."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <InboxItem
              key={task.id}
              task={task}
              onToggleComplete={toggleTask}
              onEdit={editTask}
              onDelete={removeTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
