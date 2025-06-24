import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../../services/offlineService';

interface BridgeStatus {
  connected: boolean;
  device?: string;
  smsStatus?: string;
  callStatus?: string;
  signalStrength?: number;
}

async function fetchStatus(): Promise<BridgeStatus> {
  if (offlineService.isOffline()) throw new Error('offline');
  const res = await fetch('/phonebridge/status');
  if (!res.ok) throw new Error('status');
  return res.json();
}

export function usePhoneBridge() {
  const [status, setStatus] = useState<BridgeStatus>({
    connected: false,
    signalStrength: 0,
  });

  const update = useCallback(async () => {
    if (offlineService.isOffline()) {
      setStatus({ connected: false, signalStrength: 0 });
      return;
    }
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch {
      setStatus({ connected: false, signalStrength: 0 });
    }
  }, []);

  useEffect(() => {
    update();
    const id = setInterval(update, 5000);
    const unsub = offlineService.subscribe(o => {
      if (o) setStatus({ connected: false, signalStrength: 0 });
      else update();
    });
    return () => {
      clearInterval(id);
      unsub();
    };
  }, [update]);

  const connect = useCallback(
    async (address: string) => {
      if (offlineService.isOffline()) return;
      await fetch('/phonebridge/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      update();
    },
    [update]
  );

  const disconnect = useCallback(async () => {
    if (offlineService.isOffline()) return;
    await fetch('/phonebridge/disconnect', { method: 'POST' });
    update();
  }, [update]);

  const sendSms = useCallback(
    async (to: string, body: string) => {
      if (offlineService.isOffline()) return;
      await fetch('/phonebridge/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, body }),
      });
      update();
    },
    [update]
  );

  const makeCall = useCallback(
    async (number: string) => {
      if (offlineService.isOffline()) return;
      await fetch('/phonebridge/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      });
      update();
    },
    [update]
  );

  return { status, connect, disconnect, sendSms, makeCall };
}
