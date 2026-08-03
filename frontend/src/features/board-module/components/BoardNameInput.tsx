import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface BoardNameInputProps {
  name: string;
  onRename: (newName: string) => { success: boolean; error?: string };
}

export function BoardNameInput({ name, onRename }: BoardNameInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(name);
    setError(null);
    confirmedRef.current = false;
  }, [name]);

  const handleConfirm = useCallback(() => {
    confirmedRef.current = true;
    const result = onRename(editValue);
    if (result.success) {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.error ?? 'Nome inválido');
    }
  }, [editValue, onRename]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(name);
    setError(null);
  }, [name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleConfirm, handleCancel]
  );

  const handleBlur = useCallback(() => {
    if (!confirmedRef.current) {
      handleCancel();
    }
  }, [handleCancel]);

  if (!isEditing) {
    return (
      <span
        data-testid="board-name-display"
        onDoubleClick={handleDoubleClick}
        className="cursor-pointer select-none truncate px-1 text-sm font-medium"
      >
        {name}
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <Input
        ref={inputRef}
        data-testid="board-name-input"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-7 w-32 text-sm"
      />
      {error && (
        <span
          data-testid="board-name-error"
          className="mt-0.5 text-xs text-destructive"
        >
          {error}
        </span>
      )}
    </div>
  );
}
