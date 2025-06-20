import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const STORAGE_DIR = process.env.PHILLOS_STORAGE_DIR || path.resolve(__dirname, '../storage');
export const DB_FILE = path.join(STORAGE_DIR, 'phillos.db');

export function initDb() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  execFileSync('sqlite3', [DB_FILE, `
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS emails(id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, subject TEXT, body TEXT);
CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, completed INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS tags(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY, value TEXT);
`]);
  const count = query("SELECT COUNT(*) as c FROM emails")[0]?.c || 0;
  if (count === 0) {
    execFileSync('sqlite3', [DB_FILE, `INSERT INTO emails(sender,subject,body) VALUES
('alice@example.com','Welcome to PhillOS','Thanks for trying PhillOS. Let us know what you think!'),
('bob@example.com','Meeting Tomorrow','Reminder about our meeting at 10am.');`]);
  }
}

export function query(sql) {
  const out = execFileSync('sqlite3', ['-json', DB_FILE, sql], { encoding: 'utf8' });
  if (!out.trim()) return [];
  return JSON.parse(out);
}

export function execute(sql) {
  execFileSync('sqlite3', [DB_FILE, sql]);
}
