import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
    <Dialog open={isDrawerOpen && !!selectedEvent} onOpenChange={(open: boolean) => { if (!open) closeDrawer(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-label="Editar evento">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para editar evento do calendário
          </DialogDescription>
        </DialogHeader>

        {selectedEvent && (
          <EventForm
            event={selectedEvent}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={closeDrawer}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
