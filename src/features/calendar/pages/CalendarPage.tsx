import { useState, useCallback, useRef } from 'react';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { CalendarToolbar } from '../components/CalendarToolbar';
import { CalendarMonth } from '../components/CalendarMonth';
import { EventDrawer } from '../components/EventDrawer';
import { ActivitySidebar } from '../components/ActivitySidebar';
import { ActivityDetailDrawer } from '../components/ActivityDetailDrawer';

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 340;

export function CalendarPage() {
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const getEventsForMonth = useCalendarStore((state) => state.getEventsForMonth);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isResizing = useRef(false);

  const events = getEventsForMonth(selectedDate);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  return (
    <div className="flex h-full">
      {/* Left: Calendar month view */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800">
        <CalendarToolbar />
        <div className="flex-1 overflow-hidden">
          <CalendarMonth month={selectedDate} events={events} />
        </div>
      </div>

      {/* Right: Activities for selected day with resize handle */}
      <div className="relative shrink-0 bg-zinc-950/50 flex" style={{ width: sidebarWidth }}>
        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors z-10"
          aria-label="Redimensionar painel de atividades"
          role="separator"
        />
        <div className="flex-1 min-w-0">
          <ActivitySidebar hasSelectedDate={!!selectedDate} />
        </div>
      </div>

      <EventDrawer />
      <ActivityDetailDrawer />
    </div>
  );
}
