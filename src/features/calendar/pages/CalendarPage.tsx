import { AnimatePresence, motion } from 'framer-motion';
import { startOfWeek } from 'date-fns';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { CalendarToolbar } from '../components/CalendarToolbar';
import { CompactView } from '../components/CompactView';
import { CalendarDay } from '../components/CalendarDay';
import { CalendarWeek } from '../components/CalendarWeek';
import { CalendarMonth } from '../components/CalendarMonth';
import { EventDrawer } from '../components/EventDrawer';

export function CalendarPage() {
  const isExpanded = useCalendarStore((state) => state.isExpanded);
  const viewMode = useCalendarStore((state) => state.viewMode);
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const getEventsForDate = useCalendarStore((state) => state.getEventsForDate);
  const getEventsForWeek = useCalendarStore((state) => state.getEventsForWeek);
  const getEventsForMonth = useCalendarStore((state) => state.getEventsForMonth);

  const renderExpandedView = () => {
    switch (viewMode) {
      case 'day': {
        const events = getEventsForDate(selectedDate);
        return <CalendarDay date={selectedDate} events={events} />;
      }
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const events = getEventsForWeek(weekStart);
        return <CalendarWeek weekStart={weekStart} events={events} />;
      }
      case 'month': {
        const events = getEventsForMonth(selectedDate);
        return <CalendarMonth month={selectedDate} events={events} />;
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <CalendarToolbar />

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <CompactView />
            </motion.div>
          ) : (
            <motion.div
              key={`expanded-${viewMode}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderExpandedView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EventDrawer />
    </div>
  );
}
