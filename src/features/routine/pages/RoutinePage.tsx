import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks } from 'lucide-react';

import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { RoutineCard } from '../components/RoutineCard';
import { useRoutineStore } from '../hooks/useRoutineStore';
import {
  routineSchema,
  RoutineFormData,
  Frequency,
} from '../types/routine.types';
import { cn } from '../../../lib/utils';

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'sprint', label: 'Sprint' },
];

export const RoutinePage: React.FC = () => {
  const { routines, addRoutine, toggleRoutine } = useRoutineStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      title: '',
      frequency: 'daily',
    },
  });

  const selectedFrequency = watch('frequency');

  const onSubmit = (data: RoutineFormData) => {
    addRoutine(data.title, data.frequency);
    reset();
  };

  const titleInputRef = React.useRef<HTMLInputElement | null>(null);

  const { ref: formRef, ...titleRegister } = register('title');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Rotina"
        description="Gerencie suas atividades recorrentes"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
      >
        <Input
          {...titleRegister}
          ref={(e) => {
            formRef(e);
            titleInputRef.current = e;
          }}
          label="Título da rotina"
          placeholder="Ex: Daily standup, Code review..."
          maxLength={100}
          error={errors.title?.message}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Frequência
          </span>
          <div className="flex gap-2">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('frequency', option.value)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  selectedFrequency === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" className="self-end">
          Adicionar rotina
        </Button>
      </form>

      {routines.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-10 w-10" />}
          title="Nenhuma rotina cadastrada"
          description="Crie sua primeira rotina para acompanhar suas atividades recorrentes."
          action={{
            label: 'Criar rotina',
            onClick: () => titleInputRef.current?.focus(),
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onToggleComplete={toggleRoutine}
            />
          ))}
        </div>
      )}
    </div>
  );
};

RoutinePage.displayName = 'RoutinePage';
