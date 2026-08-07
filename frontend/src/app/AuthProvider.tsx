import { ReactNode, useEffect, useState } from 'react';
import { autoLogin } from '../lib/auth';
import { getAccessToken } from '../lib/api';
import { LoginPage } from './LoginPage';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // If tokens already exist in storage (e.g. page refresh), skip autoLogin
    if (getAccessToken()) {
      setIsAuthenticated(true);
      setIsReady(true);
      return;
    }

    autoLogin().then((success) => {
      if (success) {
        setIsAuthenticated(true);
      }
      setIsReady(true);
    }).catch(() => {
      setIsReady(true);
    });
  }, []);

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

  if (!isAuthenticated && !getAccessToken()) {
    return (
      <LoginPage onSuccess={() => setIsAuthenticated(true)} />
    );
  }

  return <>{children}</>;
}
