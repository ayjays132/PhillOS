import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const STORAGE_DIR = process.env.PHILLOS_STORAGE_DIR || path.resolve(__dirname, '../storage');
export const DB_FILE = path.join(STORAGE_DIR, 'phillos.db');

let db;

export function initDb() {
  if (db) return db;
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.exec(`
CREATE TABLE IF NOT EXISTS emails(id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, subject TEXT, body TEXT, score REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, completed INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS tags(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY, value TEXT);
`);
  const count = db.prepare('SELECT COUNT(*) as c FROM emails').get().c || 0;
  if (count === 0) {
    const stmt = db.prepare('INSERT INTO emails(sender,subject,body,score) VALUES (?,?,?,?)');
    stmt.run('alice@example.com','Welcome to PhillOS','Thanks for trying PhillOS. Let us know what you think!', 0);
    stmt.run('bob@example.com','Meeting Tomorrow','Reminder about our meeting at 10am.', 0);
  }
  return db;
}

export async function query(sql, params = []) {
  return db.prepare(sql).all(params);
}

export async function execute(sql, params = []) {
  db.prepare(sql).run(params);
}
