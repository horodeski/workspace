import { Card, CardContent } from '@/components/ui/card';
import { SupportEntryRow } from './RoutineCard';
import { SupportEntry } from '../types/routine.types';

interface SupportEntryTableProps {
  entries: SupportEntry[];
  onRemove: (id: string) => Promise<void>;
  onEdit: (entry: SupportEntry) => void;
}

export function SupportEntryTable({ entries, onRemove, onEdit }: SupportEntryTableProps) {
  return (
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
                  onRemove={onRemove}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
