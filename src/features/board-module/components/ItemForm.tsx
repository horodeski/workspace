import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  boardItemSchema,
  BoardItemFormData,
  BoardItemType,
} from '../types/board.types';

export interface ItemFormProps {
  defaultValues?: { content: string; type: BoardItemType };
  onSubmit: (data: BoardItemFormData) => void;
  onCancel?: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<BoardItemFormData>({
    resolver: zodResolver(boardItemSchema),
    defaultValues: defaultValues ?? { content: '', type: undefined },
  });

  const selectedType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipo</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quote">Citação</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Conteúdo</Label>
        {selectedType === 'image' ? (
          <div className="flex flex-col gap-1">
            <Input
              id="content"
              type="text"
              placeholder="https://example.com/image.png"
              {...register('content')}
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL de uma imagem (PNG, JPEG, GIF, WebP)
            </p>
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>
        ) : (
          <>
            <Textarea
              id="content"
              placeholder="Digite o conteúdo da inspiração..."
              {...register('content')}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};
