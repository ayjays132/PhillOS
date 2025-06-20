import express from 'express';
import fs from 'fs';
import path from 'path';
import { request } from 'http';
import { URL } from 'url';
import { createProtonLauncher } from './protonLauncher.js';

const SETTINGS_FILE = path.resolve(__dirname, 'protonSettings.json');
const STORAGE_DIR = process.env.PHILLOS_STORAGE_DIR || path.resolve(__dirname, '../storage');
const THEME_FILE = path.join(STORAGE_DIR, 'theme.cfg');

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveSettings(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

function loadTheme() {
  try {
    return fs.readFileSync(THEME_FILE, 'utf8').trim();
  } catch {
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.writeFileSync(THEME_FILE, theme);
  } catch {
    // ignore
  }
}

const app = express();
app.use(express.json());

const PHONE_BRIDGE_URL = process.env.PHONE_BRIDGE_URL || 'http://localhost:3002';

app.use('/phonebridge', (req, res) => {
  const target = new URL(req.originalUrl.replace(/^\/phonebridge/, ''), PHONE_BRIDGE_URL);
  const opts = {
    method: req.method,
    headers: { ...req.headers, host: target.host },
  };
  const proxyReq = request(target, opts, proxyRes => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', err => {
    console.error('Phone bridge proxy error:', err.message);
    if (!res.headersSent) res.status(502).end();
  });
  if (req.body && Object.keys(req.body).length) {
    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
});

app.post('/api/launch-proton', async (req, res) => {
  let { path: exePath, version, prefix, wine } = req.body || {};

  if (!exePath) {
    return res.status(400).json({ error: 'path required' });
  }

  const settings = loadSettings();
  const key = path.resolve(exePath);
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

app.get('/api/theme', (req, res) => {
  res.json({ theme: loadTheme() });
});

app.post('/api/theme', (req, res) => {
  const { theme } = req.body || {};
  if (theme !== 'light' && theme !== 'dark') {
    return res.status(400).json({ error: 'invalid theme' });
  }
  saveTheme(theme);
  res.json({ success: true });
});

// --- ConverseAI ---
app.post('/api/converseai', (req, res) => {
  const { message } = req.body || {};
  res.json({ reply: `Echo: ${message || ''}` });
});

// --- InBoxAI ---
const demoMessages = [
  { id: 1, from: 'alice@example.com', subject: 'Welcome to PhillOS', body: 'Thanks for trying PhillOS. Let us know what you think!' },
  { id: 2, from: 'bob@example.com', subject: 'Meeting Tomorrow', body: 'Reminder about our meeting at 10am.' },
];

app.get('/api/inboxai/messages', (req, res) => {
  res.json({ messages: demoMessages });
});

app.post('/api/inboxai/summary', (req, res) => {
  const { id } = req.body || {};
  const msg = demoMessages.find(m => m.id === id);
  const summary = msg ? `${msg.body.slice(0, 50)}...` : 'Not found';
  res.json({ summary });
});

app.post('/api/inboxai/reply', (req, res) => {
  const { id } = req.body || {};
  res.json({ success: true, reply: `Auto reply to message ${id}` });
});

// --- WebLens ---
app.get('/api/weblens/summarize', (req, res) => {
  const url = req.query.url || '';
  res.json({ summary: `Summary of ${url}` });
});

// --- MediaSphere ---
app.get('/api/mediasphere/media', (req, res) => {
  res.json({ items: [] });
});

// --- SoundScape ---
app.get('/api/soundscape/tracks', (req, res) => {
  res.json({ tracks: [] });
});

// --- VisionVault ---
app.get('/api/visionvault/images', (req, res) => {
  res.json({ images: [] });
});

// --- SecureCore ---
app.post('/api/securecore/scan', (req, res) => {
  res.json({ status: 'ok' });
});

// --- AppForge ---
app.post('/api/appforge/build', (req, res) => {
  res.json({ success: true });
});

// --- SpaceManager ---
app.get('/api/spacemanager/usage', (req, res) => {
  res.json({ used: 0, total: 0 });
});

// --- Pulse Monitor ---
app.get('/api/pulsemonitor/status', (req, res) => {
  res.json({ bpm: 72 });
});

// --- BrainPad ---
app.get('/api/brainpad/entries', (req, res) => {
  res.json({ entries: [] });
});

const PORT = process.env.PORT || 3001;
if (!process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`Proton launcher server listening on port ${PORT}`);
  });
}

export default app;
