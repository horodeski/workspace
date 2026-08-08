/**
 * In-memory login attempt tracker for account lockout.
 * Complements rate limiting with per-email tracking to prevent
 * credential stuffing from distributed IPs.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

// Periodic cleanup every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (record.lockedUntil && record.lockedUntil < now) {
      attempts.delete(key);
    } else if (now - record.firstAttempt > LOCKOUT_DURATION_MS) {
      attempts.delete(key);
    }
  }
}, 30 * 60 * 1000);

export function isAccountLocked(email: string): boolean {
  const record = attempts.get(email);
  if (!record || !record.lockedUntil) return false;

  if (Date.now() >= record.lockedUntil) {
    attempts.delete(email);
    return false;
  }

  return true;
}

export function recordFailedAttempt(email: string): void {
  const record = attempts.get(email);
  const now = Date.now();

  if (!record) {
    attempts.set(email, { count: 1, firstAttempt: now, lockedUntil: null });
    return;
  }

  // Reset if window expired
  if (now - record.firstAttempt > LOCKOUT_DURATION_MS) {
    attempts.set(email, { count: 1, firstAttempt: now, lockedUntil: null });
    return;
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
}

export function resetAttempts(email: string): void {
  attempts.delete(email);
}
