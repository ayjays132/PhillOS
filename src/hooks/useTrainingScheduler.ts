import { useEffect } from 'react';

export function useTrainingScheduler(enabled: boolean, frequencyMs: number) {
  useEffect(() => {
    if (!enabled) return;
    let timer: number;

    const run = async () => {
      try {
        await fetch('/training/start', { method: 'POST' });
      } catch {
        // ignore network errors
      }
    };

    const schedule = () => {
      const cb = async () => {
        await run();
        timer = window.setTimeout(schedule, frequencyMs);
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(cb);
      } else {
        timer = window.setTimeout(cb, frequencyMs);
      }
    };

    schedule();
    return () => {
      clearTimeout(timer);
    };
  }, [enabled, frequencyMs]);
}
