import { renderHook } from '@testing-library/react';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

const mockProceed = jest.fn();
const mockReset = jest.fn();
const mockBlocker = { state: 'idle', proceed: mockProceed, reset: mockReset };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useBlocker: (fn: (...args: unknown[]) => boolean) => {
    // Store the blocker function for testing
    (global as Record<string, unknown>).__blockerFn = fn;
    return mockBlocker;
  },
}));

describe('useUnsavedChangesGuard', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockProceed.mockClear();
    mockReset.mockClear();
    mockBlocker.state = 'idle';
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('passes a blocker function that blocks when isDirty is true and paths differ', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    const blockerFn = (global as Record<string, unknown>).__blockerFn as (
      args: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }
    ) => boolean;

    const shouldBlock = blockerFn({
      currentLocation: { pathname: '/weekly-review/2025/31' },
      nextLocation: { pathname: '/weekly-review' },
    });
    expect(shouldBlock).toBe(true);
  });

  it('does not block when isDirty is false', () => {
    renderHook(() => useUnsavedChangesGuard(false));

    const blockerFn = (global as Record<string, unknown>).__blockerFn as (
      args: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }
    ) => boolean;

    const shouldBlock = blockerFn({
      currentLocation: { pathname: '/weekly-review/2025/31' },
      nextLocation: { pathname: '/weekly-review' },
    });
    expect(shouldBlock).toBe(false);
  });

  it('does not block when navigating to the same pathname', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    const blockerFn = (global as Record<string, unknown>).__blockerFn as (
      args: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }
    ) => boolean;

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

  it('beforeunload handler calls preventDefault on the event', () => {
    renderHook(() => useUnsavedChangesGuard(true));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1];

    const mockEvent = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;
    handler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls proceed when user confirms navigation on blocked state', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockBlocker.state = 'blocked';

    renderHook(() => useUnsavedChangesGuard(true));

    expect(mockProceed).toHaveBeenCalled();
    (window.confirm as jest.Mock).mockRestore();
  });

  it('calls reset when user cancels navigation on blocked state', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    mockBlocker.state = 'blocked';

    renderHook(() => useUnsavedChangesGuard(true));

    expect(mockReset).toHaveBeenCalled();
    (window.confirm as jest.Mock).mockRestore();
  });
});
