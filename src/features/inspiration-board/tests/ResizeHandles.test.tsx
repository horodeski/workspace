import { render, screen, fireEvent } from '@testing-library/react';
import { ResizeHandles } from '../components/ResizeHandles';
import type { HandlePosition } from '../components/ResizeHandles';

describe('ResizeHandles', () => {
  const mockOnResizeStart = jest.fn();

  beforeEach(() => {
    mockOnResizeStart.mockClear();
  });

  it('renders 8 handles when visible is true', () => {
    const { container } = render(
      <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
    );

    const handles = container.querySelectorAll('[data-handle]');
    expect(handles).toHaveLength(8);
  });

  it('renders no handles when visible is false', () => {
    const { container } = render(
      <ResizeHandles onResizeStart={mockOnResizeStart} visible={false} />
    );

    const handles = container.querySelectorAll('[data-handle]');
    expect(handles).toHaveLength(0);
  });

  it('renders all 4 corner handles (nw, ne, sw, se)', () => {
    const { container } = render(
      <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
    );

    const corners: HandlePosition[] = ['nw', 'ne', 'sw', 'se'];
    corners.forEach((pos) => {
      expect(container.querySelector(`[data-handle="${pos}"]`)).toBeInTheDocument();
    });
  });

  it('renders all 4 edge handles (n, s, e, w)', () => {
    const { container } = render(
      <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
    );

    const edges: HandlePosition[] = ['n', 's', 'e', 'w'];
    edges.forEach((pos) => {
      expect(container.querySelector(`[data-handle="${pos}"]`)).toBeInTheDocument();
    });
  });

  describe('cursor styles', () => {
    it('applies nwse-resize cursor to nw and se corners', () => {
      const { container } = render(
        <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
      );

      const nw = container.querySelector('[data-handle="nw"]') as HTMLElement;
      const se = container.querySelector('[data-handle="se"]') as HTMLElement;

      expect(nw.style.cursor).toBe('nwse-resize');
      expect(se.style.cursor).toBe('nwse-resize');
    });

    it('applies nesw-resize cursor to ne and sw corners', () => {
      const { container } = render(
        <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
      );

      const ne = container.querySelector('[data-handle="ne"]') as HTMLElement;
      const sw = container.querySelector('[data-handle="sw"]') as HTMLElement;

      expect(ne.style.cursor).toBe('nesw-resize');
      expect(sw.style.cursor).toBe('nesw-resize');
    });

    it('applies ew-resize cursor to w and e edges', () => {
      const { container } = render(
        <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
      );

      const w = container.querySelector('[data-handle="w"]') as HTMLElement;
      const e = container.querySelector('[data-handle="e"]') as HTMLElement;

      expect(w.style.cursor).toBe('ew-resize');
      expect(e.style.cursor).toBe('ew-resize');
    });

    it('applies ns-resize cursor to n and s edges', () => {
      const { container } = render(
        <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
      );

      const n = container.querySelector('[data-handle="n"]') as HTMLElement;
      const s = container.querySelector('[data-handle="s"]') as HTMLElement;

      expect(n.style.cursor).toBe('ns-resize');
      expect(s.style.cursor).toBe('ns-resize');
    });
  });

  describe('onResizeStart callback', () => {
    it('calls onResizeStart with handle position on pointer down', () => {
      const { container } = render(
        <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
      );

      const nwHandle = container.querySelector('[data-handle="nw"]') as HTMLElement;
      fireEvent.pointerDown(nwHandle);

      expect(mockOnResizeStart).toHaveBeenCalledTimes(1);
      expect(mockOnResizeStart).toHaveBeenCalledWith('nw', expect.any(Object));
    });

    it('calls onResizeStart for each handle position', () => {
      const { container } = render(
        <ResizeHandles onResizeStart={mockOnResizeStart} visible={true} />
      );

      const positions: HandlePosition[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

      positions.forEach((pos) => {
        mockOnResizeStart.mockClear();
        const handle = container.querySelector(`[data-handle="${pos}"]`) as HTMLElement;
        fireEvent.pointerDown(handle);

        expect(mockOnResizeStart).toHaveBeenCalledWith(pos, expect.any(Object));
      });
    });
  });
});
