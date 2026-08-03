import { setTokens } from './api';

const DEV_EMAIL = 'dev@workspace.local';
const DEV_PASSWORD = 'password123';

export async function autoLogin(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
