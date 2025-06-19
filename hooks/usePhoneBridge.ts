import { useState, useEffect, useCallback } from 'react';

interface BridgeStatus {
  connected: boolean;
  device?: string;
}

async function fetchStatus(): Promise<BridgeStatus> {
  const res = await fetch('/phonebridge/status');
  if (!res.ok) throw new Error('status');
  return res.json();
}

export function usePhoneBridge() {
  const [status, setStatus] = useState<BridgeStatus>({ connected: false });

  const update = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    }
  }, []);

  useEffect(() => {
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [update]);

  const connect = useCallback(
    async (address: string) => {
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
    await fetch('/phonebridge/disconnect', { method: 'POST' });
    update();
  }, [update]);

  return { status, connect, disconnect };
}
