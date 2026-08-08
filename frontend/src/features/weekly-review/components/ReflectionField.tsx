import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 500;

export interface ReflectionFieldProps {
  id: string;
  emoji: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Extracts plain text length from HTML content (strips tags via regex).
 */
function getTextLength(html: string): number {
  if (!html || html === '<p></p>') return 0;
  return html.replace(/<[^>]*>/g, '').length;
}

export const ReflectionField: React.FC<ReflectionFieldProps> = ({
  id,
  emoji,
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const counterId = `${id}-counter`;
  const errorId = `${id}-error`;

  const ariaDescribedBy = [counterId, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  // Ref to latest onChange to keep editor config stable
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  // Ref to track if we're programmatically updating content
  const isSyncingRef = React.useRef(false);

  // Use a stable key to detect when content should be reinitialized
  // This ensures the editor recreates with correct content when value changes from empty to filled
  const contentKey = React.useMemo(() => {
    // Create a key based on whether value has content or not
    const hasContent = value && value !== '<p></p>' && value.replace(/<[^>]*>/g, '').trim().length > 0;
    return hasContent ? 'has-content' : 'empty';
  }, [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: true,
    onUpdate: ({ editor: ed }) => {
      if (isSyncingRef.current) return;

      const html = ed.getHTML();
      const textLength = ed.state.doc.textContent.length;

      if (textLength > MAX_LENGTH) {
        ed.commands.undo();
        return;
      }

      onChangeRef.current(html);
    },
    editorProps: {
      attributes: {
        id,
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': error ? 'true' : 'false',
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2',
          'text-sm text-foreground',
          '[&_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_p.is-editor-empty:first-child::before]:float-left',
          '[&_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_p.is-editor-empty:first-child::before]:h-0',
        ),
      },
    },
  }, [contentKey, disabled]);

  // Sync disabled state
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      if (editor.isEditable !== !disabled) {
        editor.setEditable(!disabled, false);
      }
    }
  }, [editor, disabled]);

  // Sync content when value changes externally (backup for deps-based recreation)
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === editor.getHTML()) return;

    isSyncingRef.current = true;
    try {
      editor.commands.setContent(value || '');
    } finally {
      isSyncingRef.current = false;
    }
  }, [editor, value]);

  const textLength = editor ? editor.state.doc.textContent.length : getTextLength(value);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {emoji} {label}
      </label>

      <div
        className={cn(
          'w-full rounded-md border border-input bg-background overflow-hidden',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive'
        )}
      >
        {/* Toolbar - hidden when disabled/locked */}
        {!disabled && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-input bg-muted/30">
            <ToolbarButton
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Negrito"
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Itálico"
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              aria-label="Sublinhado"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <div className="w-px h-4 bg-input mx-1" />
            <ToolbarButton
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-label="Lista"
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              aria-label="Lista numerada"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarButton>
          </div>
        )}

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>

      <div
        id={counterId}
        aria-live="polite"
        className="text-xs text-muted-foreground"
      >
        {textLength} / {MAX_LENGTH} caracteres
      </div>
      {error && (
        <p
          id={errorId}
          className="text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

function ToolbarButton({
  active,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'p-1 rounded transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
      {...props}
    >
      {children}
    </button>
  );
}

ReflectionField.displayName = 'ReflectionField';
