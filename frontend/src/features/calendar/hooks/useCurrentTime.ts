import { useState, useEffect } from 'react';

/**
 * Calculates the percentage position of the current time within a 24-hour day.
 * Returns a value in [0, 100].
 */
export function getCurrentTimePosition(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const percentage = (totalMinutes / (24 * 60)) * 100;
  return percentage;
}

/**
 * React hook that returns the current Date, updated every `intervalMs` milliseconds.
 * Cleans up the interval on unmount.
 */
export function useCurrentTime(intervalMs: number = 60000): Date {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return currentTime;
}
