import React, { useState } from 'react';
import { Textarea } from '../../../components/Textarea';
import { Button } from '../../../components/Button';

export interface JournalEditorProps {
  onSave: (text: string) => void;
  isLoading?: boolean;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  onSave,
  isLoading = false,
}) => {
  const [text, setText] = useState('');

  const isDisabled = text.trim().length === 0;

  const handleSave = () => {
    if (isDisabled) return;
    onSave(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isDisabled) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="O que você fez hoje?"
        minHeight="200px"
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isDisabled}
          isLoading={isLoading}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
};
