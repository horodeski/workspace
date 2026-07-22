import React, { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { startOfISOWeek, addDays } from 'date-fns';

import { reviewFormSchema, type ReviewFormData } from '../types/review.types';
import { useReviewStore } from '../hooks/useReviewStore';
import { getISOWeekData, formatWeekRange } from '../services/weekCalculation';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { ReviewHeader } from '../components/ReviewHeader';
import { ReflectionField } from '../components/ReflectionField';
import { SaveButton } from '../components/SaveButton';
import { LockedBanner } from '../components/LockedBanner';

const REFLECTION_FIELDS = [
  {
    name: 'learning' as const,
    emoji: '💡',
    label: 'Aprendizados',
    placeholder: 'O que você aprendeu esta semana?',
  },
  {
    name: 'decisions' as const,
    emoji: '⚖️',
    label: 'Decisões',
    placeholder: 'Qual decisão exigiu mais análise?',
  },
  {
    name: 'resolvedProblems' as const,
    emoji: '🧹',
    label: 'Problemas resolvidos',
    placeholder: 'Que problema você conseguiu eliminar ou reduzir?',
  },
  {
    name: 'timeWaste' as const,
    emoji: '⏳',
    label: 'Tempo',
    placeholder: 'Em que atividade você investiu tempo que poderia ter sido melhor aproveitado?',
  },
  {
    name: 'nextWeekFocus' as const,
    emoji: '🎯',
    label: 'Próxima semana',
    placeholder: 'Qual será seu principal foco na próxima semana?',
  },
] as const;

/**
 * Constructs a Date from an ISO week-year and week number.
 * Returns a date that falls within the specified ISO week.
 */
function dateFromISOWeek(year: number, week: number): Date {
  // January 4 is always in ISO week 1 of its year
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = startOfISOWeek(jan4);
  // Add (week - 1) * 7 days to get to the desired week
  return addDays(startOfWeek1, (week - 1) * 7);
}

export const WeeklyReviewEditPage: React.FC = () => {
  const params = useParams<{ year: string; week: string }>();
  const { saveReview, getReviewByWeek, unlockReview } = useReviewStore();

  // Validate URL params
  const yearNum = Number(params.year);
  const weekNum = Number(params.week);

  const isValidParams =
    Number.isInteger(yearNum) &&
    Number.isInteger(weekNum) &&
    weekNum >= 1 &&
    weekNum <= 53 &&
    !isNaN(yearNum);

  // Compute week data from the year+week params
  const weekData = useMemo(() => {
    if (!isValidParams) return null;
    const refDate = dateFromISOWeek(yearNum, weekNum);
    return getISOWeekData(refDate);
  }, [yearNum, weekNum, isValidParams]);

  const dateRange = useMemo(() => {
    if (!weekData) return '';
    return formatWeekRange(weekData.startDate, weekData.endDate);
  }, [weekData]);

  // Get existing review
  const existingReview = isValidParams ? getReviewByWeek(yearNum, weekNum) : undefined;
  const [isLocked, setIsLocked] = useState(existingReview?.isLocked ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: existingReview
      ? {
          learning: existingReview.learning,
          decisions: existingReview.decisions,
          resolvedProblems: existingReview.resolvedProblems,
          timeWaste: existingReview.timeWaste,
          nextWeekFocus: existingReview.nextWeekFocus,
        }
      : {
          learning: '',
          decisions: '',
          resolvedProblems: '',
          timeWaste: '',
          nextWeekFocus: '',
        },
    mode: 'onChange',
  });

  // Unsaved changes guard: active when form is dirty and review is unlocked
  useUnsavedChangesGuard(form.formState.isDirty && !isLocked);

  // Redirect if invalid params
  if (!isValidParams || !weekData) {
    return <Navigate to="/weekly-review" replace />;
  }

  const handleSave = async (data: ReviewFormData) => {
    setIsSaving(true);
    setSaveError(undefined);
    setShowConfirmation(false);

    try {
      saveReview({
        learning: data.learning,
        decisions: data.decisions,
        resolvedProblems: data.resolvedProblems,
        timeWaste: data.timeWaste,
        nextWeekFocus: data.nextWeekFocus,
        weekNumber: weekNum,
        year: yearNum,
        startDate: weekData.startDate.toISOString(),
        endDate: weekData.endDate.toISOString(),
      });

      setShowConfirmation(true);
      setIsLocked(true);
      form.reset(data);
    } catch {
      setSaveError('Não foi possível salvar a revisão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlock = () => {
    if (existingReview) {
      unlockReview(existingReview.id);
      setIsLocked(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="mx-auto w-full px-4 sm:max-w-[640px] lg:max-w-[720px] py-6">
      <ReviewHeader weekNumber={weekNum} dateRange={dateRange} />

      {isLocked && <LockedBanner onUnlock={handleUnlock} />}

      <p className="text-sm text-muted-foreground mt-4 mb-6">
        Reserve 5 minutos para refletir sobre sua semana.
      </p>

      <form
        onSubmit={form.handleSubmit(handleSave)}
        noValidate
        className="space-y-6"
      >
        {REFLECTION_FIELDS.map((field) => (
          <Controller
            key={field.name}
            name={field.name}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <ReflectionField
                id={`reflection-${field.name}`}
                emoji={field.emoji}
                label={field.label}
                placeholder={field.placeholder}
                value={controllerField.value}
                onChange={controllerField.onChange}
                error={fieldState.error?.message}
                disabled={isLocked}
              />
            )}
          />
        ))}

        {form.formState.errors.root?.message && (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}

        {!isLocked && (
          <SaveButton
            onSave={form.handleSubmit(handleSave)}
            isSaving={isSaving}
            showConfirmation={showConfirmation}
            error={saveError}
          />
        )}
      </form>
    </div>
  );
};

WeeklyReviewEditPage.displayName = 'WeeklyReviewEditPage';
