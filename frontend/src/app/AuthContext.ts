import { createContext } from 'react';

export interface AuthContextValue {
  logout: () => void;
  user: { name: string; avatarUrl: string | null } | null;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({ logout: () => {}, user: null, refreshUser: async () => {} });
