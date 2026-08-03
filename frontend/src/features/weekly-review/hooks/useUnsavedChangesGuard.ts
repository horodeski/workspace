import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Guards against navigation when there are unsaved changes.
 * Shows a confirmation dialog for in-app navigation and beforeunload for browser close.
 *
 * @param isDirty - true when the form has unsaved changes
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  // Block react-router navigation when dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Show confirmation when blocker is triggered
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Deseja sair sem salvar?'
      );
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

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
