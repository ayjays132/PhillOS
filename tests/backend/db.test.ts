import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phillos-test-'));
  process.env.PHILLOS_STORAGE_DIR = tmpDir;
});

describe('db async api', () => {
  it('insert and query notes', async () => {
    const { initDb, query, execute } = await import('../../backend/db.js');
    initDb();
    await execute("INSERT INTO notes(content, created_at) VALUES('test', 1)");
    const rows = await query('SELECT content, created_at FROM notes');
    expect(rows[0]).toEqual({ content: 'test', created_at: 1 });
  });
});
