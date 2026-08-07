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
    }
  }, [entry, reset]);

  const onSubmit = async (data: SupportEntryFormData) => {
    await onSave({
      date: data.date,
      description: data.description,
      duration: data.duration,
      observation: data.observation ?? '',
    });
  };

  return (
    <Dialog open={entry !== null} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
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
          />
          <Input
            {...register('description')}
            label="Descrição"
            placeholder="Ex: Ajudei o Heitor a subir o ambiente"
            error={errors.description?.message}
          />
          <Input
            {...register('duration')}
            label="Duração"
            placeholder="Ex: 2h"
            maxLength={20}
            error={errors.duration?.message}
          />
          <Input
            {...register('observation')}
            label="Observação"
            placeholder="Ex: foto da ligação"
            error={errors.observation?.message}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
