import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

async function networkFirst(url: string, cacheName: string) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(url);
    await cache.put(url, res.clone());
    return res;
  } catch {
    const cached = await cache.match(url);
    if (cached) return cached;
    throw new Error('offline');
  }
}

describe('service worker offline cache', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  });

  it('returns cached user settings when offline', async () => {
    const cache = await caches.open('settings-cache');
    await cache.put('/api/theme', new Response(JSON.stringify({ theme: 'dark' })));
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const res = await networkFirst('/api/theme', 'settings-cache');
    expect(await res.json()).toEqual({ theme: 'dark' });
  });

  it('returns cached tasks when offline', async () => {
    const cache = await caches.open('settings-cache');
    await cache.put('/api/tasks', new Response(JSON.stringify({ tasks: ['x'] })));
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const res = await networkFirst('/api/tasks', 'settings-cache');
    expect(await res.json()).toEqual({ tasks: ['x'] });
  });
});
