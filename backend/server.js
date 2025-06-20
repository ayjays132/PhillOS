import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { request } from 'http';
import { URL } from 'url';
import { spawn } from 'child_process';
import { createProtonLauncher } from './protonLauncher.js';
import { initDb, query, execute } from './db.js';

const STORAGE_DIR = path.resolve(process.env.PHILLOS_STORAGE_DIR || path.join(__dirname, '../storage'));
const ALLOWED_FILES = new Set(['protonSettings.json', 'theme.cfg']);

function sanitizeStoragePath(name) {
  const base = path.basename(name);
  if (!ALLOWED_FILES.has(base)) throw new Error('invalid filename');
  return path.join(STORAGE_DIR, base);
}

const SETTINGS_FILE = sanitizeStoragePath('protonSettings.json');
const THEME_FILE = sanitizeStoragePath('theme.cfg');

function sanitizeUserPath(p) {
  if (typeof p !== 'string' || p.includes('\0')) throw new Error('invalid path');
  return path.resolve(p);
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveSettings(data) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

async function loadTheme() {
  try {
    const row = (await query("SELECT value FROM preferences WHERE key='theme'"))[0];
    if (row && (row.value === 'light' || row.value === 'dark')) return row.value;
  } catch {}
  try {
    return fs.readFileSync(THEME_FILE, 'utf8').trim();
  } catch {
    return 'dark';
  }
}

async function saveTheme(theme) {
  try {
    await execute(
      'INSERT INTO preferences(key,value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=?',
      ['theme', theme, theme],
    );
  } catch {}
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.writeFileSync(THEME_FILE, theme);
  } catch {
    // ignore
  }
}

const app = express();
app.use(express.json());

initDb();

const PHONE_BRIDGE_URL = process.env.PHONE_BRIDGE_URL || 'http://localhost:3002';
const PROXY_TIMEOUT = Number(process.env.PHONE_BRIDGE_TIMEOUT || 2000);
const MAX_RETRIES = 2;

app.use('/phonebridge', (req, res) => {
  const target = new URL(req.originalUrl.replace(/^\/phonebridge/, ''), PHONE_BRIDGE_URL);
  const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : null;
  const opts = {
    method: req.method,
    headers: { ...req.headers, host: target.host },
    timeout: PROXY_TIMEOUT,
  };

  const attempt = (n) => {
    const proxyReq = request(target, opts, proxyRes => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('timeout', () => proxyReq.destroy(new Error('timeout')));
    proxyReq.on('error', err => {
      if (n > 0) {
        console.warn('Phone bridge proxy retry:', err.message);
        return attempt(n - 1);
      }
      console.error('Phone bridge proxy error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'phone bridge unreachable' });
    });
    if (body) {
      proxyReq.write(body);
      proxyReq.end();
    } else {
      proxyReq.end();
    }
  };

  attempt(MAX_RETRIES);
});

app.post('/api/launch-proton', async (req, res) => {
  let { path: exePath, version, prefix, wine } = req.body || {};

  if (!exePath) {
    return res.status(400).json({ error: 'path required' });
  }

  try {
    exePath = sanitizeUserPath(exePath);
  } catch {
    return res.status(400).json({ error: 'invalid path' });
  }

  const settings = loadSettings();
  const key = exePath;
  const stored = settings[key] || {};

  version = version || stored.version;
  prefix = prefix || stored.prefix;
  wine = wine || stored.wineBinary;

  try {
    const launcher = createProtonLauncher({ version, prefix, wineBinary: wine });
    await launcher.launch(exePath);
    settings[key] = { version, prefix, wineBinary: wine };
    saveSettings(settings);
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to launch';
    res.status(500).json({ error: message });
  }
});

app.get('/api/theme', async (req, res) => {
  res.json({ theme: await loadTheme() });
});

app.post('/api/theme', async (req, res) => {
  const { theme } = req.body || {};
  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ error: 'invalid theme' });
  }
  await saveTheme(theme);
  res.json({ success: true });
});

// --- ConverseAI ---
app.post('/api/converseai', (req, res) => {
  const { message } = req.body || {};
  res.json({ reply: `Echo: ${message || ''}` });
});

// --- InBoxAI ---
app.get('/api/inboxai/messages', async (req, res) => {
  const messages = await query("SELECT id, sender as 'from', subject, body FROM emails");
  res.json({ messages });
});

app.get('/api/inboxai/messages-sorted', async (req, res) => {
  const messages = await query("SELECT id, sender as 'from', subject, body, score FROM emails ORDER BY score DESC");
  res.json({ messages });
});

app.post('/api/inboxai/summary', async (req, res) => {
  const { id } = req.body || {};
  const row = (await query('SELECT body FROM emails WHERE id=?', [Number(id)]))[0];
  const summary = row ? `${row.body.slice(0, 50)}...` : 'Not found';
  res.json({ summary });
});

app.post('/api/inboxai/reply', async (req, res) => {
  const { id, body } = req.body || {};
  const text = String(body || '');
  await execute(
    'INSERT INTO emails(sender,subject,body) VALUES(?,?,?)',
    ['me@example.com', `Re:${id}`, text],
  );
  res.json({ success: true });
});

// --- WebLens ---
app.get('/api/weblens/summarize', async (req, res) => {
  const url = req.query.url || '';
  try {
    const r = await fetch(String(url));
    const text = await r.text();
    res.json({ summary: text.slice(0, 200) });
  } catch {
    res.json({ summary: `Summary of ${url}` });
  }
});

// --- MediaSphere ---
let firewallEnabled = true;

app.get('/api/mediasphere/media', (req, res) => {
  const dir = path.join(STORAGE_DIR, 'media');
  let items = [];
  try {
    items = fs.readdirSync(dir)
      .filter(f => !fs.statSync(path.join(dir, f)).isDirectory())
      .map((f, i) => ({ id: i + 1, title: f }));
  } catch {}
  res.json({ items });
});

app.post('/api/mediasphere/analyze', (req, res) => {
  const { id } = req.body || {};
  const dir = path.join(STORAGE_DIR, 'media');
  try {
    const files = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory());
    const file = files[id - 1];
    if (file) {
      const size = fs.statSync(path.join(dir, file)).size;
      return res.json({ result: `Size ${size} bytes` });
    }
  } catch {}
  res.json({ result: 'Not found' });
});


async function detectScenes(file) {
  const duration = await new Promise(resolve => {
    const p = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ]);
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.on('close', () => resolve(parseFloat(out.trim()) || 0));
    p.on('error', () => resolve(0));
  });

  const times = await new Promise(resolve => {
    const args = [
      '-i', file,
      '-vf', "select=gt(scene\\,0.4),showinfo",
      '-f', 'null',
      '-',
    ];
    const p = spawn('ffmpeg', args);
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', () => {
      const matches = [...err.matchAll(/pts_time:([0-9.]+)/g)];
      resolve(matches.map(m => parseFloat(m[1])).filter(n => !Number.isNaN(n)));
    });
    p.on('error', () => resolve([]));
  });

  return { duration, chapters: times.map((t, i) => ({ start: t, title: `Scene ${i + 1}` })) };
}

app.post('/api/mediasphere/chapters', async (req, res) => {
  const { id } = req.body || {};
  const dir = path.join(STORAGE_DIR, 'media');
  try {
    const files = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory());
    const file = files[id - 1];
    if (file) {
      const data = await detectScenes(path.join(dir, file));
      return res.json(data);
    }
  } catch {}
  res.json({ chapters: [], duration: 0 });
});

// --- SoundScape ---
app.get('/api/soundscape/tracks', (req, res) => {
  const dir = path.join(STORAGE_DIR, 'music');
  let tracks = [];
  try {
    tracks = fs.readdirSync(dir)
      .filter(f => f.endsWith('.mp3'))
      .map((f, i) => ({ id: i + 1, title: path.parse(f).name, artist: 'Unknown' }));
  } catch {}
  res.json({ tracks });
});

// --- VisionVault ---
const demoImages = [
  'https://placekitten.com/200/200',
  'https://placekitten.com/200/201',
];

app.get('/api/visionvault/images', (req, res) => {
  const dir = path.join(STORAGE_DIR, 'images');
  let images = [];
  try {
    images = fs.readdirSync(dir)
      .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
      .map(f => path.join('/images', f));
  } catch {}
  if (images.length === 0) images = demoImages;
  res.json({ images });
});

// --- SecureCore ---
app.get('/api/securecore/status', (req, res) => {
  res.json({ firewall: firewallEnabled });
});

app.post('/api/securecore/toggle', (req, res) => {
  firewallEnabled = !firewallEnabled;
  res.json({ firewall: firewallEnabled });
});

app.post('/api/securecore/scan', (req, res) => {
  const usedMem = os.totalmem() - os.freemem();
  res.json({ status: 'ok', usedMemory: usedMem });
});

// --- AppForge ---
app.post('/api/appforge/build', (req, res) => {
  res.json({ success: true });
});

// --- SpaceManager ---
app.get('/api/spacemanager/usage', (req, res) => {
  res.json({ used: 42, total: 100 });
});

// --- Pulse Monitor ---
app.get('/api/pulsemonitor/status', (req, res) => {
  const bpm = Math.round(os.loadavg()[0] * 10 + 70);
  res.json({ bpm });
});

// --- BrainPad ---
app.get('/api/brainpad/entries', async (req, res) => {
  const entries = await query('SELECT id, content, created_at FROM notes ORDER BY created_at DESC');
  res.json({ entries });
});

app.post('/api/brainpad/entries', async (req, res) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: 'content required' });
  const text = String(content);
  await execute('INSERT INTO notes(content, created_at) VALUES(?, ?)', [text, Date.now()]);
  res.json({ success: true });
});

app.get('/api/tasks', async (req, res) => {
  const tasks = await query('SELECT id, title, completed FROM tasks');
  res.json({ tasks });
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const text = String(title);
  await execute('INSERT INTO tasks(title, completed) VALUES(?, 0)', [text]);
  res.json({ success: true });
});

app.post('/api/tasks/:id/toggle', async (req, res) => {
  const id = Number(req.params.id);
  await execute(
    'UPDATE tasks SET completed=CASE completed WHEN 0 THEN 1 ELSE 0 END WHERE id=?',
    [id],
  );
  res.json({ success: true });
});

app.get('/api/tags', async (req, res) => {
  const tags = await query('SELECT id, name FROM tags');
  res.json({ tags });
});

app.post('/api/tags', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const text = String(name);
  await execute('INSERT OR IGNORE INTO tags(name) VALUES(?)', [text]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
if (!process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`Proton launcher server listening on port ${PORT}`);
  });
}

export default app;
export { sanitizeUserPath, sanitizeStoragePath, STORAGE_DIR };
