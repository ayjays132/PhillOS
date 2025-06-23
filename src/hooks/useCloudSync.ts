import { useEffect, useRef } from 'react';
import { offlineService } from '../../services/offlineService';

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

// Select which backend to use for synchronizing settings. Supported values:
// "webdav", "s3", or "api". Defaults to WebDAV for backwards compatibility.
const BACKEND = (import.meta.env.VITE_CLOUD_SYNC_BACKEND || 'webdav') as
  | 'webdav'
  | 's3'
  | 'api';

// WebDAV configuration
const DAV_URL = import.meta.env.VITE_WEBDAV_URL as string | undefined;
const DAV_USERNAME = import.meta.env.VITE_WEBDAV_USERNAME as string | undefined;
const DAV_PASSWORD = import.meta.env.VITE_WEBDAV_PASSWORD as string | undefined;

// Amazon S3 (or compatible) configuration. VITE_S3_URL should point to the
// object where settings are stored. It can be a presigned URL or a bucket URL
// that accepts anonymous requests. If authentication is required, provide an
// "Authorization" header via VITE_S3_AUTH_HEADER.
const S3_URL = import.meta.env.VITE_S3_URL as string | undefined;
const S3_AUTH_HEADER = import.meta.env.VITE_S3_AUTH_HEADER as string | undefined;

// Custom API backend. The API should accept a POST with JSON to update settings
// and respond to a GET request with the same JSON structure.
const API_URL = import.meta.env.VITE_SYNC_API_URL as string | undefined;
const API_TOKEN = import.meta.env.VITE_SYNC_API_TOKEN as string | undefined;

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
  switch (BACKEND) {
    case 's3':
      if (!S3_URL) return;
      await fetch(S3_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(S3_AUTH_HEADER ? { Authorization: S3_AUTH_HEADER } : {}),
        },
        body: data,
      });
      break;
    case 'api':
      if (!API_URL) return;
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
        },
        body: data,
      });
      break;
    case 'webdav':
    default:
      if (!DAV_URL) return;
      await fetch(`${DAV_URL}/settings.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(DAV_USERNAME
            ? { Authorization: 'Basic ' + btoa(`${DAV_USERNAME}:${DAV_PASSWORD || ''}`) }
            : {}),
        },
        body: data,
      });
  }
}

async function download(): Promise<SyncData | null> {
  try {
    switch (BACKEND) {
      case 's3': {
        if (!S3_URL) return null;
        const res = await fetch(S3_URL, {
          headers: S3_AUTH_HEADER ? { Authorization: S3_AUTH_HEADER } : undefined,
        });
        if (!res.ok) return null;
        return (await res.json()) as SyncData;
      }
      case 'api': {
        if (!API_URL) return null;
        const res = await fetch(API_URL, {
          headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : undefined,
        });
        if (!res.ok) return null;
        return (await res.json()) as SyncData;
      }
      case 'webdav':
      default: {
        if (!DAV_URL) return null;
        const res = await fetch(`${DAV_URL}/settings.json`, {
          headers: DAV_USERNAME
            ? { Authorization: 'Basic ' + btoa(`${DAV_USERNAME}:${DAV_PASSWORD || ''}`) }
            : undefined,
        });
        if (!res.ok) return null;
        return (await res.json()) as SyncData;
      }
    }
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
      if (!navigator.onLine || offlineService.isOffline()) return;
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
        if (navigator.onLine && !offlineService.isOffline()) {
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
    const unsub = offlineService.subscribe(o => {
      if (!o) flushQueue();
    });
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', flushQueue);
      unsub();
    };
  }, [enabled]);
}
