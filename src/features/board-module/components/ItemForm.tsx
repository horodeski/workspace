import React, { useState, useRef } from 'react';
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
import { validateImageFile } from '../services/imageValidation';

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
  const [imageContent, setImageContent] = useState<string>(
    defaultValues?.type === 'image' ? defaultValues.content : ''
  );
  const [imageError, setImageError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BoardItemFormData>({
    resolver: zodResolver(boardItemSchema),
    defaultValues: defaultValues ?? { content: '', type: undefined },
  });

  const selectedType = watch('type');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');

    const validation = validateImageFile(file.type, file.size);
    if (!validation.valid) {
      setImageError(validation.error!);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageContent(dataUrl);
      setValue('content', dataUrl, { shouldValidate: true });
    };
    reader.onerror = () => {
      setImageError('Failed to process image');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageContent(url);
    setValue('content', url, { shouldValidate: true });
    setImageError('');
  };

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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="image-upload" className="text-sm font-normal">
                Upload image
              </Label>
              <Input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleFileChange}
              />
            </div>

            <p className="text-sm text-muted-foreground text-center">or</p>

            <div className="flex flex-col gap-1">
              <Label htmlFor="image-url" className="text-sm font-normal">
                Or paste URL
              </Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.png"
                value={
                  imageContent.startsWith('data:') ? '' : imageContent
                }
                onChange={handleUrlChange}
              />
            </div>

            {imageError && (
              <p className="text-sm text-destructive">{imageError}</p>
            )}
            {errors.content && !imageError && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}

            {/* Hidden field to keep react-hook-form in sync */}
            <input type="hidden" {...register('content')} />
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
