import React from 'react';
import { ClipboardList, Copy, Download, Check, CheckCircle2 } from 'lucide-react';

import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { SupportEntryForm } from '../components/SupportEntryForm';
import { SupportEntryTable } from '../components/SupportEntryTable';
import { FormattedTextPreview } from '../components/FormattedTextPreview';
import { EditEntryDialog } from '../components/EditEntryDialog';
import { useSupportCardStore } from '../hooks/useRoutineStore';
import { SupportEntry } from '../types/routine.types';

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const RoutinePage: React.FC = () => {
  const { entries, formattedText, isLoading, addEntry, updateEntry, removeEntry, clearEntries, getFormattedText, getAllAttachments, fetchEntries } =
    useSupportCardStore();

  const [copied, setCopied] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<SupportEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<SupportEntry | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const fetched = React.useRef(false);

  React.useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchEntries().finally(() => setInitialLoad(false));
  }, [fetchEntries]);

  React.useEffect(() => {
    if (entries.length > 0) {
      getFormattedText();
    }
  }, [entries, getFormattedText]);

  const totalAttachments = entries.reduce((sum, e) => sum + (e.attachments?.length ?? 0), 0);

  if (initialLoad && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-400 border-t-transparent rounded-full" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  const handleCopyText = async () => {
    const text = await getFormattedText();
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
    setShowFinalizeConfirm(true);
  };

  const handleConfirmFinalize = async () => {
    setIsFinalizing(true);
    await clearEntries();
    setIsFinalizing(false);
    setShowFinalizeConfirm(false);
  };

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

      <SupportEntryForm onAdd={addEntry} />

      {entries.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Nenhuma atividade registrada"
          description="Adicione atividades de apoio para gerar o texto do card."
        />
      ) : (
        <>
          <SupportEntryTable
            entries={entries}
            onRemove={async (id) => {
              const entry = entries.find((e) => e.id === id);
              if (entry) setDeleteTarget(entry);
            }}
            onEdit={setEditingEntry}
          />
          <FormattedTextPreview
            text={formattedText}
            copied={copied}
            onCopy={handleCopyText}
          />
        </>
      )}

      <EditEntryDialog
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={async (data) => {
          if (editingEntry) {
            await updateEntry(editingEntry.id, data);
            setEditingEntry(null);
          }
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.description || ''}
        isLoading={isDeleting}
        onConfirm={async () => {
          if (deleteTarget) {
            setIsDeleting(true);
            await removeEntry(deleteTarget.id);
            setIsDeleting(false);
            setDeleteTarget(null);
          }
        }}
      />

      <ConfirmDeleteDialog
        open={showFinalizeConfirm}
        onOpenChange={(open) => { if (!open) setShowFinalizeConfirm(false); }}
        title="card de apoio"
        description="Tem certeza que deseja finalizar o card de apoio? Todos os registros e anexos serão apagados."
        isLoading={isFinalizing}
        onConfirm={handleConfirmFinalize}
      />
    </div>
  );
};

RoutinePage.displayName = 'RoutinePage';
