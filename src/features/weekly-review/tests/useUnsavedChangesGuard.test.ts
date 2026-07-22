import { renderHook } from '@testing-library/react';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

const mockUseBlocker = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useBlocker: (...args: unknown[]) => mockUseBlocker(...args),
}));

describe('useUnsavedChangesGuard', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockUseBlocker.mockClear();
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('calls useBlocker with a function that blocks when isDirty is true and paths differ', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    expect(mockUseBlocker).toHaveBeenCalledWith(expect.any(Function));

    const blockerFn = mockUseBlocker.mock.calls[0][0];
    const shouldBlock = blockerFn({
      currentLocation: { pathname: '/weekly-review/2025/31' },
      nextLocation: { pathname: '/weekly-review' },
    });
    expect(shouldBlock).toBe(true);
  });

  it('does not block when isDirty is false', () => {
    renderHook(() => useUnsavedChangesGuard(false));

    expect(mockUseBlocker).toHaveBeenCalledWith(expect.any(Function));

    const blockerFn = mockUseBlocker.mock.calls[0][0];
    const shouldBlock = blockerFn({
      currentLocation: { pathname: '/weekly-review/2025/31' },
      nextLocation: { pathname: '/weekly-review' },
    });
    expect(shouldBlock).toBe(false);
  });

  it('does not block when navigating to the same pathname', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    const blockerFn = mockUseBlocker.mock.calls[0][0];
    const shouldBlock = blockerFn({
      currentLocation: { pathname: '/weekly-review/2025/31' },
      nextLocation: { pathname: '/weekly-review/2025/31' },
    });
    expect(shouldBlock).toBe(false);
  });

  it('adds beforeunload event listener when isDirty is true', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('does not add beforeunload event listener when isDirty is false', () => {
    renderHook(() => useUnsavedChangesGuard(false));

    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === 'beforeunload'
    );
    expect(beforeUnloadCalls).toHaveLength(0);
  });

  it('removes beforeunload event listener on unmount when isDirty is true', () => {
    const { unmount } = renderHook(() => useUnsavedChangesGuard(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('removes beforeunload event listener when isDirty changes from true to false', () => {
    const { rerender } = renderHook(
      ({ isDirty }) => useUnsavedChangesGuard(isDirty),
      { initialProps: { isDirty: true } }
    );

    rerender({ isDirty: false });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('beforeunload handler calls preventDefault on the event', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1];

    const mockEvent = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;
    handler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
});
