import { useState, useRef } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api, setTokens, getAccessToken } from '../lib/api';
import { User } from 'lucide-react';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  emailVerified?: boolean;
  user?: { name: string; avatarUrl: string | null };
}

interface LoginPageProps {
  onSuccess: (verified?: boolean, user?: { name: string; avatarUrl: string | null }) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    async function uploadAvatar(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      const baseUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/v1`
        : '/api/v1';
      try {
        await fetch(`${baseUrl}/auth/avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getAccessToken()}` },
          body: formData,
          credentials: 'include',
        });
      } catch {}
    }

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };
      const data = await api.post<AuthResponse>(endpoint, body);

      if (data.accessToken && data.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
        // Upload avatar after login if provided
        if (avatarFile) {
          await uploadAvatar(avatarFile);
          // Fetch updated profile so avatar URL is available
          const profile = await api.get<{ name: string; avatarUrl: string | null }>('/auth/me');
          onSuccess(data.emailVerified, profile);
        } else {
          onSuccess(data.emailVerified, data.user);
        }
      } else if (isRegister) {
        // Register succeeded but may not return tokens — try login
        const loginData = await api.post<AuthResponse>('/auth/login', { email, password });
        setTokens(loginData.accessToken, loginData.refreshToken);
        if (avatarFile) {
          await uploadAvatar(avatarFile);
          const profile = await api.get<{ name: string; avatarUrl: string | null }>('/auth/me');
          onSuccess(loginData.emailVerified, profile);
        } else {
          onSuccess(loginData.emailVerified, loginData.user);
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as { status: number; message: string; body?: { details?: { message: string }[] } };
        if (apiErr.status === 409) {
          setError('Email já cadastrado.');
        } else if (apiErr.status === 401) {
          setError('Email ou senha incorretos.');
        } else if (apiErr.status === 400 && apiErr.body?.details?.length) {
          setError(apiErr.body.details.map((d) => d.message).join('. '));
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
          {isRegister && (
            <>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </button>
                <span className="text-xs text-muted-foreground">Foto de perfil (opcional)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <Input
                label="Nome"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </>
          )}

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
