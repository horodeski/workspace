import { ReactNode, useEffect, useState, useCallback } from 'react';
import { autoLogin } from '../lib/auth';
import { getAccessToken, clearTokens, getRefreshToken, api } from '../lib/api';
import { LoginPage } from './LoginPage';
import { VerifyEmailPage } from './VerifyEmailPage';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

const EMAIL_VERIFIED_KEY = 'email_verified';
const USER_NAME_KEY = 'user_name';
const USER_AVATAR_KEY = 'user_avatar';

export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailVerified, setEmailVerified] = useState(() => localStorage.getItem(EMAIL_VERIFIED_KEY) === 'true');
  const [user, setUser] = useState<{ name: string; avatarUrl: string | null } | null>(() => {
    const name = localStorage.getItem(USER_NAME_KEY);
    const avatar = localStorage.getItem(USER_AVATAR_KEY);
    return name ? { name, avatarUrl: avatar || null } : null;
  });

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.get<{ name: string; avatarUrl: string | null }>('/auth/me');
      setUser({ name: profile.name, avatarUrl: profile.avatarUrl });
      localStorage.setItem(USER_NAME_KEY, profile.name);
      if (profile.avatarUrl) localStorage.setItem(USER_AVATAR_KEY, profile.avatarUrl);
      else localStorage.removeItem(USER_AVATAR_KEY);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    clearTokens();
    localStorage.removeItem(EMAIL_VERIFIED_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_AVATAR_KEY);
    sessionStorage.setItem('logged_out', '1');
    setIsAuthenticated(false);
    setEmailVerified(false);
    setUser(null);
  }, []);

  useEffect(() => {
    // If tokens already exist in storage (e.g. page refresh), skip autoLogin
    if (getAccessToken()) {
      setIsAuthenticated(true);
      // Fetch user profile if not in localStorage
      if (!localStorage.getItem(USER_NAME_KEY)) {
        api.get<{ name: string; avatarUrl: string | null }>('/auth/me')
          .then((profile) => {
            setUser({ name: profile.name, avatarUrl: profile.avatarUrl });
            localStorage.setItem(USER_NAME_KEY, profile.name);
            if (profile.avatarUrl) localStorage.setItem(USER_AVATAR_KEY, profile.avatarUrl);
          })
          .catch(() => {});
      }
      setIsReady(true);
      return;
    }

    // Skip autoLogin if user explicitly logged out (flag cleared on successful login)
    if (sessionStorage.getItem('logged_out')) {
      setIsReady(true);
      return;
    }

    autoLogin().then(async (success) => {
      if (success) {
        setIsAuthenticated(true);
        setEmailVerified(true);
        localStorage.setItem(EMAIL_VERIFIED_KEY, 'true');
        // Fetch user profile after autoLogin
        try {
          const profile = await api.get<{ name: string; avatarUrl: string | null }>('/auth/me');
          setUser({ name: profile.name, avatarUrl: profile.avatarUrl });
          localStorage.setItem(USER_NAME_KEY, profile.name);
          if (profile.avatarUrl) localStorage.setItem(USER_AVATAR_KEY, profile.avatarUrl);
        } catch (error) {
          console.error('Failed to fetch user profile after autoLogin:', error);
        }
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
      <LoginPage onSuccess={(verified?: boolean, userData?: { name: string; avatarUrl: string | null }) => {
        sessionStorage.removeItem('logged_out');
        setIsAuthenticated(true);
        if (userData) {
          setUser(userData);
          localStorage.setItem(USER_NAME_KEY, userData.name);
          if (userData.avatarUrl) localStorage.setItem(USER_AVATAR_KEY, userData.avatarUrl);
        }
        if (verified) {
          setEmailVerified(true);
          localStorage.setItem(EMAIL_VERIFIED_KEY, 'true');
        }
      }} />
    );
  }

  if (!emailVerified) {
    return (
      <VerifyEmailPage
        onVerified={() => {
          setEmailVerified(true);
          localStorage.setItem(EMAIL_VERIFIED_KEY, 'true');
        }}
        onLogout={logout}
      />
    );
  }

  return <AuthContext.Provider value={{ logout, user, refreshUser }}>{children}</AuthContext.Provider>;
}
