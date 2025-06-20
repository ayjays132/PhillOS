import { useEffect, useState, useCallback } from 'react';
import { focusBurstService, FocusPhase } from '../../services/focusBurstService';

export function useFocusBurst(workMinutes = 25, breakMinutes = 5) {
  const [{ phase, secondsLeft }, setState] = useState(() => focusBurstService.getState());

  useEffect(() => {
    const unsub = focusBurstService.subscribe((p, s) => setState({ phase: p, secondsLeft: s }));
    return unsub;
  }, []);

  const start = useCallback(() => {
    focusBurstService.start(workMinutes, breakMinutes);
  }, [workMinutes, breakMinutes]);

  const stop = useCallback(() => {
    focusBurstService.stop();
  }, []);

  return { phase: phase as FocusPhase, timeLeft: secondsLeft, running: phase !== 'idle', start, stop };
}

export type { FocusPhase } from '../../services/focusBurstService';
