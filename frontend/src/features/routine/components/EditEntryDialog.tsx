import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/Input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  supportEntrySchema,
  SupportEntryFormData,
  SupportEntry,
} from '../types/routine.types';

interface EditEntryDialogProps {
  entry: SupportEntry | null;
  onClose: () => void;
  onSave: (data: { date: string; description: string; duration: string; observation: string }) => Promise<void>;
}

export function EditEntryDialog({ entry, onClose, onSave }: EditEntryDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportEntryFormData>({
    resolver: zodResolver(supportEntrySchema) as Resolver<SupportEntryFormData>,
    defaultValues: {
      date: entry?.date ?? '',
      description: entry?.description ?? '',
      duration: entry?.duration ?? '',
      observation: entry?.observation ?? '',
    },
  });

  React.useEffect(() => {
    if (entry) {
      reset({
        date: entry.date,
        description: entry.description,
        duration: entry.duration,
        observation: entry.observation,
      });
      setIsSaving(false);
    }
  }, [entry, reset]);

  const onSubmit = async (data: SupportEntryFormData) => {
    setIsSaving(true);
    try {
      await onSave({
        date: data.date,
        description: data.description,
        duration: data.duration,
        observation: data.observation ?? '',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={entry !== null} onOpenChange={(open: boolean) => { if (!open && !isSaving) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar atividade</DialogTitle>
          <DialogDescription>
            Altere os dados da atividade de apoio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            {...register('date')}
            label="Data"
            placeholder="DD/MM"
            maxLength={5}
            error={errors.date?.message}
            disabled={isSaving}
          />
          <Input
            {...register('description')}
            label="Descrição"
            placeholder="Ex: Ajudei o Heitor a subir o ambiente"
            error={errors.description?.message}
            disabled={isSaving}
          />
          <Input
            {...register('duration')}
            label="Duração"
            placeholder="Ex: 2h"
            maxLength={20}
            error={errors.duration?.message}
            disabled={isSaving}
          />
          <Input
            {...register('observation')}
            label="Observação"
            placeholder="Ex: foto da ligação"
            error={errors.observation?.message}
            disabled={isSaving}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
