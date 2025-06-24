// db.js
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STORAGE_DIR = process.env.PHILLOS_STORAGE_DIR || path.resolve(__dirname, '../storage');
export const DB_FILE = path.join(STORAGE_DIR, 'phillos.db');

let db = null;
let SQL = null;

// Helper: persist db to disk
function persist() {
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

export async function initDb() {
  if (db) return db;
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!SQL) SQL = await initSqlJs();
  try {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } catch (e) {
    db = new SQL.Database();
    // Fresh DB, run migrations
    db.run(`
      CREATE TABLE IF NOT EXISTS emails(id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, subject TEXT, body TEXT, score REAL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, created_at INTEGER);
      CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, completed INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS tags(path TEXT PRIMARY KEY, tags TEXT);
      CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS profiles(name TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, password TEXT, pin TEXT);
    `);
    // Add seed data
    db.run(`INSERT INTO emails(sender,subject,body,score) VALUES ('alice@example.com','Welcome to PhillOS','Thanks for trying PhillOS. Let us know what you think!', 0)`);
    db.run(`INSERT INTO emails(sender,subject,body,score) VALUES ('bob@example.com','Meeting Tomorrow','Reminder about our meeting at 10am.', 0)`);
    persist();
  }
  return db;
}

// SQL SELECT
export async function query(sql, params = []) {
  const db = await initDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// SQL INSERT/UPDATE/DELETE
export async function execute(sql, params = []) {
  const db = await initDb();
  db.run(sql, params);
  persist();
}

// Profile operations
export async function getProfile(name) {
  const rows = await query('SELECT data FROM profiles WHERE name=?', [name]);
  if (!rows.length) return null;
  return JSON.parse(rows[0].data);
}
export async function saveProfile(name, data) {
  const text = JSON.stringify(data);
  await execute(
    `INSERT INTO profiles(name,data) VALUES(?,?) 
     ON CONFLICT(name) DO UPDATE SET data=excluded.data`,
    [name, text]
  );
}

// User password hashing/verification
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const hashed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashed, 'hex'));
}

// User CRUD
export async function createUser(username, password, pin = null) {
  const stored = hashPassword(password);
  const pinHash = pin ? hashPassword(pin) : null;
  await execute(
    `INSERT INTO users(username,password,pin) VALUES(?,?,?)
     ON CONFLICT(username) DO UPDATE SET password=excluded.password, pin=excluded.pin`,
    [username, stored, pinHash]
  );
}
export async function getUserHash(username) {
  const rows = await query('SELECT password FROM users WHERE username=?', [username]);
  return rows.length ? rows[0].password : null;
}
export async function verifyPin(pin) {
  const rows = await query('SELECT pin FROM users WHERE pin IS NOT NULL');
  for (const row of rows) {
    if (verifyPassword(pin, row.pin)) return true;
  }
  return false;
}
