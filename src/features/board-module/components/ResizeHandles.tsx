import React from 'react';

export type HandlePosition = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeHandlesProps {
  onResizeStart: (handle: HandlePosition, e: React.PointerEvent) => void;
  visible: boolean;
}

interface HandleConfig {
  position: HandlePosition;
  cursor: string;
  className: string;
}

const HANDLE_SIZE = 8;

const cornerHandles: HandleConfig[] = [
  {
    position: 'nw',
    cursor: 'nwse-resize',
    className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
  },
  {
    position: 'ne',
    cursor: 'nesw-resize',
    className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
  },
  {
    position: 'sw',
    cursor: 'nesw-resize',
    className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
  },
  {
    position: 'se',
    cursor: 'nwse-resize',
    className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  },
];

const edgeHandles: HandleConfig[] = [
  {
    position: 'n',
    cursor: 'ns-resize',
    className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
  },
  {
    position: 's',
    cursor: 'ns-resize',
    className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
  },
  {
    position: 'w',
    cursor: 'ew-resize',
    className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2',
  },
  {
    position: 'e',
    cursor: 'ew-resize',
    className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
  },
];

const allHandles: HandleConfig[] = [...cornerHandles, ...edgeHandles];

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  onResizeStart,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <>
      {allHandles.map((handle) => (
        <div
          key={handle.position}
          data-handle={handle.position}
          className={`absolute z-10 rounded-sm bg-blue-500 border border-white ${handle.className}`}
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: handle.cursor,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart(handle.position, e);
          }}
        />
      ))}
    </>
  );
};

ResizeHandles.displayName = 'ResizeHandles';
