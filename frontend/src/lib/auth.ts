import { setTokens } from './api';

/**
 * Auto-login for development only.
 * Credentials are sourced from environment variables and will NOT be
 * included in production builds (Vite strips import.meta.env.DEV blocks).
 */
export async function autoLogin(): Promise<boolean> {
  if (!import.meta.env.DEV) return false;

  const email = import.meta.env.VITE_DEV_EMAIL;
  const password = import.meta.env.VITE_DEV_PASSWORD;

  if (!email || !password) return false;

  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
