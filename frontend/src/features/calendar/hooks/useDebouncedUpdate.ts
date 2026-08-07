import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook that debounces calls to an async update function.
 * Returns a stable callback that accumulates partial updates
 * and flushes them after the specified delay.
 */
export function useDebouncedUpdate<T>(
  updateFn: (id: string, data: Partial<T>) => Promise<void>,
  delay = 500
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ id: string; data: Partial<T> } | null>(null);

  const flush = useCallback(() => {
    if (pendingRef.current) {
      const { id, data } = pendingRef.current;
      pendingRef.current = null;
      updateFn(id, data);
    }
  }, [updateFn]);

  const debouncedUpdate = useCallback(
    (id: string, data: Partial<T>) => {
      // Merge with any pending partial update for same id
      if (pendingRef.current && pendingRef.current.id === id) {
        pendingRef.current.data = { ...pendingRef.current.data, ...data };
      } else {
        // Different id or first call — flush previous if any, start new
        if (pendingRef.current) {
          flush();
        }
        pendingRef.current = { id, data };
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, delay);
    },
    [delay, flush]
  );

  // Flush on unmount to avoid losing pending changes
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [flush]);

  return debouncedUpdate;
}
