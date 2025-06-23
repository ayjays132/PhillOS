import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
CREATE TABLE IF NOT EXISTS tags(path TEXT PRIMARY KEY, tags TEXT);
CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS profiles(name TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, password TEXT, pin TEXT);
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

export async function getProfile(name) {
  const row = db.prepare('SELECT data FROM profiles WHERE name=?').get(name);
  return row && row.data ? JSON.parse(row.data) : null;
}

export async function saveProfile(name, data) {
  const text = JSON.stringify(data);
  db.prepare(
    'INSERT INTO profiles(name,data) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET data=?'
  ).run(name, text, text);
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const hashed = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashed, 'hex'));
}

export function createUser(username, password, pin = null) {
  const stored = hashPassword(password);
  const pinHash = pin ? hashPassword(pin) : null;
  db.prepare(
    'INSERT INTO users(username,password,pin) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET password=?, pin=?'
  ).run(username, stored, pinHash, stored, pinHash);
}

export function getUserHash(username) {
  const row = db.prepare('SELECT password FROM users WHERE username=?').get(username);
  return row && row.password;
}

export function verifyPin(pin) {
  const rows = db.prepare('SELECT pin FROM users WHERE pin IS NOT NULL').all();
  for (const row of rows) {
    if (verifyPassword(pin, row.pin)) return true;
  }
  return false;
}
