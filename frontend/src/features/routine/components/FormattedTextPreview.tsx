import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FormattedTextPreviewProps {
  text: string;
  copied: boolean;
  onCopy: () => void;
}

export function FormattedTextPreview({ text, copied, onCopy }: FormattedTextPreviewProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Prévia do texto
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
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
          {text}
        </pre>
      </CardContent>
    </Card>
  );
}
