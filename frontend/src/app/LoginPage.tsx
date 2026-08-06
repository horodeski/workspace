import { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api, setTokens } from '../lib/api';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const data = await api.post<AuthResponse>(endpoint, { email, password });

      if (data.accessToken && data.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
        onSuccess();
      } else if (isRegister) {
        // Register succeeded but may not return tokens — try login
        const loginData = await api.post<AuthResponse>('/auth/login', { email, password });
        setTokens(loginData.accessToken, loginData.refreshToken);
        onSuccess();
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as { status: number; message: string };
        if (apiErr.status === 409) {
          setError('Email já cadastrado.');
        } else if (apiErr.status === 401) {
          setError('Email ou senha incorretos.');
        } else {
          setError(apiErr.message || 'Erro ao processar requisição.');
        }
      } else {
        setError('Não foi possível conectar ao servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {isRegister ? 'Criar conta' : 'Entrar'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRegister
              ? 'Preencha os dados para criar sua conta'
              : 'Entre com suas credenciais'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
            required
            minLength={isRegister ? 8 : 1}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            {isRegister ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {isRegister
              ? 'Já tem conta? Entre aqui'
              : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
