import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Copy, Download, Check, CheckCircle2 } from 'lucide-react';

import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Input } from '../../../components/Input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SupportEntryRow } from '../components/RoutineCard';
import { useSupportCardStore } from '../hooks/useRoutineStore';
import {
  supportEntrySchema,
  SupportEntryFormData,
} from '../types/routine.types';

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const RoutinePage: React.FC = () => {
  const { entries, addEntry, removeEntry, clearEntries, getFormattedText, getAllAttachments } =
    useSupportCardStore();

  const [copied, setCopied] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<SupportEntryFormData>({
    resolver: zodResolver(supportEntrySchema),
    defaultValues: {
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      description: '',
      duration: '',
      observation: '',
    },
  });

  const onSubmit = (data: SupportEntryFormData) => {
    addEntry({
      date: data.date,
      description: data.description,
      duration: data.duration,
      observation: data.observation ?? '',
      attachments: [],
    });
    reset({
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      description: '',
      duration: '',
      observation: '',
    });
    setFocus('description');
  };

  const handleCopyText = async () => {
    const text = getFormattedText();
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAttachments = () => {
    const allAttachments = getAllAttachments();
    if (allAttachments.length === 0) return;

    for (const { attachment } of allAttachments) {
      downloadDataUrl(attachment.dataUrl, attachment.name);
    }
  };

  const handleFinalize = () => {
    if (!confirm('Tem certeza que deseja finalizar o card de apoio? Todos os registros e anexos serão apagados.')) {
      return;
    }
    clearEntries();
  };

  const dateRef = React.useRef<HTMLInputElement | null>(null);
  const totalAttachments = entries.reduce((sum, e) => sum + (e.attachments?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Card de Apoio"
        description="Registre atividades de apoio e copie o texto formatado para o card do Kanban"
        actions={
          entries.length > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copiado!' : 'Copiar texto'}
              </Button>
              {totalAttachments > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAttachments}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar anexos ({totalAttachments})
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleFinalize}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar card
              </Button>
            </>
          ) : undefined
        }
      />

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

      {entries.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Nenhuma atividade registrada"
          description="Adicione atividades de apoio para gerar o texto do card."
          action={{
            label: 'Registrar atividade',
            onClick: () => dateRef.current?.focus(),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Duração
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Observação
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Anexos
                    </th>
                    <th className="px-3 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <SupportEntryRow
                      key={entry.id}
                      entry={entry}
                      onRemove={removeEntry}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Prévia do texto
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyText}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/30 rounded-md p-3 font-mono">
              {getFormattedText()}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

RoutinePage.displayName = 'RoutinePage';
