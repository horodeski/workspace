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
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-transparent select-none">
              _
            </span>
            <Button type="submit" size="sm">
              Adicionar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
