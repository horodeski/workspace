import React from 'react';
import { Quote, Image, Link, StickyNote, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BoardItem, BoardItemType } from '../types/board.types';

export interface BoardItemCardProps {
  item: BoardItem;
  onEdit: (item: BoardItem) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<BoardItemType, { icon: React.ElementType; label: string }> = {
  quote: { icon: Quote, label: 'Citação' },
  image: { icon: Image, label: 'Imagem' },
  link: { icon: Link, label: 'Link' },
  note: { icon: StickyNote, label: 'Nota' },
};

export const BoardItemCard: React.FC<BoardItemCardProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const { icon: TypeIcon, label: typeLabel } = typeConfig[item.type];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <TypeIcon className="h-3 w-3" />
          {typeLabel}
        </span>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
          {item.content}
        </p>
      </CardContent>

      <CardFooter className="gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          aria-label={`Editar item "${item.content.slice(0, 30)}"`}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          aria-label={`Excluir item "${item.content.slice(0, 30)}"`}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

BoardItemCard.displayName = 'BoardItemCard';
