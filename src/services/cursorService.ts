const CURSOR_KEY = 'phillos-cursor-theme';

class CursorService {
  async getCursor(): Promise<'light' | 'dark' | null> {
    try {
      const stored = localStorage.getItem(CURSOR_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}

    try {
      const res = await fetch('/api/cursor');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && (data.cursor === 'light' || data.cursor === 'dark')) {
        localStorage.setItem(CURSOR_KEY, data.cursor);
        return data.cursor;
      }
    } catch {}
    return null;
  }

  async setCursor(theme: 'light' | 'dark') {
    try {
      localStorage.setItem(CURSOR_KEY, theme);
    } catch {}
    try {
      await fetch('/api/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursor: theme }),
      });
    } catch {}
  }
}

export const cursorService = new CursorService();
