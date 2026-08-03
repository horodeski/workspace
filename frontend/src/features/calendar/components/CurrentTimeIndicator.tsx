import { useCurrentTime, getCurrentTimePosition } from '../hooks/useCurrentTime';

export function CurrentTimeIndicator() {
  // Call useCurrentTime to trigger re-renders every 60 seconds
  useCurrentTime();

  const position = getCurrentTimePosition();

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${position}%` }}
    >
      <div className="relative flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  );
}
