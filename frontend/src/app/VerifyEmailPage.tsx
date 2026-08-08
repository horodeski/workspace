import { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../lib/api';

interface VerifyEmailPageProps {
  onVerified: () => void;
  onLogout: () => void;
}

export function VerifyEmailPage({ onVerified, onLogout }: VerifyEmailPageProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/verify-email', { code });
      onVerified();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message || 'Código inválido ou expirado.');
      } else {
        setError('Erro ao verificar código.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      await api.post('/auth/resend-verification');
      setSuccess('Novo código enviado para seu email.');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message || 'Erro ao reenviar código.');
      } else {
        setError('Erro ao reenviar código.');
      }
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Verificar email</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos um código de 6 dígitos para seu email. Insira abaixo para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Código de verificação"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            maxLength={6}
            autoComplete="one-time-code"
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600" role="status">
              {success}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            disabled={code.length !== 6}
          >
            Verificar
          </Button>
        </form>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-muted-foreground hover:text-foreground underline disabled:opacity-50"
          >
            {isResending ? 'Enviando...' : 'Reenviar código'}
          </button>

          <div>
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-muted-foreground hover:text-destructive underline"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
