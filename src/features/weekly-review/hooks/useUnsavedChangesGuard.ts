import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Guards against navigation when there are unsaved changes.
 * Blocks react-router navigation and browser tab close/refresh.
 *
 * @param isDirty - true when the form has unsaved changes
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  // Block react-router navigation when dirty
  useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Block browser refresh/close when dirty
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
