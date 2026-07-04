import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks } from 'lucide-react';

import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Input } from '@/components/Input';
import { Button } from '../../../components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RoutineCard } from '../components/RoutineCard';
import { useRoutineStore } from '../hooks/useRoutineStore';
import {
  routineSchema,
  RoutineFormData,
  Frequency,
} from '../types/routine.types';

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

      <Card>
        <CardContent className="p-4 pt-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
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
              <ToggleGroup
                type="single"
                value={selectedFrequency}
                onValueChange={(value) => {
                  if (value) setValue('frequency', value as Frequency);
                }}
              >
                {frequencyOptions.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <Button type="submit" variant="primary" size="md" className="self-end">
              Adicionar rotina
            </Button>
          </form>
        </CardContent>
      </Card>

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
