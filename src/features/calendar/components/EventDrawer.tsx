import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { EventForm } from './EventForm';
import { CalendarEventFormData } from '../types/calendar.types';

export function EventDrawer() {
  const isDrawerOpen = useCalendarStore((state) => state.isDrawerOpen);
  const selectedEvent = useCalendarStore((state) => state.selectedEvent);
  const closeDrawer = useCalendarStore((state) => state.closeDrawer);
  const updateEvent = useCalendarStore((state) => state.updateEvent);
  const removeEvent = useCalendarStore((state) => state.removeEvent);

  const handleSave = (data: CalendarEventFormData) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, data);
    }
  };

  const handleDelete = (id: string) => {
    removeEvent(id);
  };

  return (
    <Sheet open={isDrawerOpen && !!selectedEvent} onOpenChange={(open: boolean) => { if (!open) closeDrawer(); }}>
      <SheetContent side="right" className="w-96 overflow-y-auto" aria-label="Editar evento">
        <SheetHeader>
          <SheetTitle>Editar Evento</SheetTitle>
          <SheetDescription className="sr-only">
            Formulário para editar evento do calendário
          </SheetDescription>
        </SheetHeader>

        {selectedEvent && (
          <EventForm
            event={selectedEvent}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={closeDrawer}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
