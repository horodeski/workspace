import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/Input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  supportEntrySchema,
  SupportEntryFormData,
} from '../types/routine.types';

interface SupportEntryFormProps {
  onAdd: (data: { date: string; description: string; duration: string; observation: string }) => Promise<void>;
}

export function SupportEntryForm({ onAdd }: SupportEntryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<SupportEntryFormData>({
    resolver: zodResolver(supportEntrySchema) as Resolver<SupportEntryFormData>,
    defaultValues: {
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      description: '',
      duration: '',
      observation: '',
    },
  });

  const onSubmit = async (data: SupportEntryFormData) => {
    setIsSaving(true);
    try {
      await onAdd({
        date: data.date,
        description: data.description,
        duration: data.duration,
        observation: data.observation ?? '',
      });
      reset({
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        description: '',
        duration: '',
        observation: '',
      });
      setFocus('description');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 pt-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-[80px_1fr_80px_1fr_auto] gap-3 items-start"
        >
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
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-transparent select-none">
              _
            </span>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving && (
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Adicionar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
