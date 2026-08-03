import { ReactNode, useEffect, useState } from 'react';
import { autoLogin } from '../lib/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    autoLogin()
      .then((success) => {
        if (success) {
          setIsReady(true);
        } else {
          setError('Falha ao conectar com o servidor. Verifique se o backend está rodando.');
        }
      })
      .catch(() => {
        setError('Erro de conexão com o servidor.');
      });
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 p-8">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">
            Execute: sudo docker-compose up no diretório workspace-backend
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm underline text-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Conectando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
