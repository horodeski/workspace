import pino from 'pino';
import { authService } from '../../modules/auth/auth.service.js';

const logger = pino({ name: 'token-cleanup' });

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Starts periodic cleanup of expired and revoked refresh tokens.
 * Runs every hour to prevent unbounded table growth.
 */
export function startTokenCleanup(): void {
  if (cleanupTimer) return;

  async function run() {
    try {
      const count = await authService.deleteExpiredTokens();
      if (count > 0) {
        logger.info({ deletedTokens: count }, 'Expired refresh tokens cleaned up');
      }
    } catch (error) {
      logger.error({ err: error }, 'Token cleanup failed');
    }
  }

  // Run once on startup
  run();

  cleanupTimer = setInterval(run, CLEANUP_INTERVAL_MS);
  logger.info('Token cleanup scheduled (every 1h)');
}

export function stopTokenCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
