import { useEffect, useRef } from 'react';

interface SyncData {
  [key: string]: string | null;
}

const SETTINGS_KEYS = [
  'phillos_widget_order',
  'phillos_dock_items_v1',
  'phillos_onboarding_state_v3',
  'phillos-theme',
];

const QUEUE_KEY = 'phillos_cloud_sync_queue';

const DAV_URL = import.meta.env.VITE_WEBDAV_URL as string | undefined;
const DAV_USERNAME = import.meta.env.VITE_WEBDAV_USERNAME as string | undefined;
const DAV_PASSWORD = import.meta.env.VITE_WEBDAV_PASSWORD as string | undefined;

function loadQueue(): string[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(q: string[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

async function upload(data: string) {
  if (!DAV_URL) return;
  await fetch(`${DAV_URL}/settings.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(DAV_USERNAME ? { Authorization: 'Basic ' + btoa(`${DAV_USERNAME}:${DAV_PASSWORD || ''}`) } : {}),
    },
    body: data,
  });
}

async function download(): Promise<SyncData | null> {
  if (!DAV_URL) return null;
  try {
    const res = await fetch(`${DAV_URL}/settings.json`, {
      headers: DAV_USERNAME
        ? { Authorization: 'Basic ' + btoa(`${DAV_USERNAME}:${DAV_PASSWORD || ''}`) }
        : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json as SyncData;
  } catch {
    return null;
  }
}

function getLocalData(): SyncData {
  const data: SyncData = {};
  for (const key of SETTINGS_KEYS) {
    data[key] = localStorage.getItem(key);
  }
  return data;
}

function applyData(data: SyncData) {
  for (const [k, v] of Object.entries(data)) {
    if (v !== null) localStorage.setItem(k, v);
  }
}

export function useCloudSync(enabled: boolean) {
  const lastData = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const flushQueue = async () => {
      if (!navigator.onLine) return;
      const queue = loadQueue();
      while (queue.length) {
        const item = queue[0];
        try {
          await upload(item);
          queue.shift();
        } catch {
          break; // stop on first failure
        }
      }
      saveQueue(queue);
    };

    const sync = async () => {
      const current = JSON.stringify(getLocalData());
      if (current !== lastData.current) {
        if (navigator.onLine) {
          try {
            await upload(current);
            lastData.current = current;
          } catch {
            const q = loadQueue();
            q.push(current);
            saveQueue(q);
          }
        } else {
          const q = loadQueue();
          q.push(current);
          saveQueue(q);
        }
      }
    };

    const init = async () => {
      const remote = await download();
      if (remote) {
        applyData(remote);
        lastData.current = JSON.stringify(remote);
      }
      await flushQueue();
      await sync();
    };

    init();
    const interval = setInterval(sync, 5000);
    window.addEventListener('online', flushQueue);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', flushQueue);
    };
  }, [enabled]);
}
