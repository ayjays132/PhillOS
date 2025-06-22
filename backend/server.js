import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { request, createServer } from 'http';
import { WebSocketServer } from 'ws';
import { URL } from 'url';
import { spawn } from 'child_process';
import { createProtonLauncher } from './protonLauncher.js';
import { scoreExecutable, RISK_THRESHOLD } from './sandboxShield.js';
import { initDb, query, execute } from './db.js';
import ffi from 'ffi-napi';
import { patternAlertService } from '../services/patternAlertService';
import { researchMate } from '../services/researchMate';
import { exec } from 'child_process';

const STORAGE_DIR = path.resolve(process.env.PHILLOS_STORAGE_DIR || path.join(__dirname, '../storage'));
const ALLOWED_FILES = new Set(['protonSettings.json', 'theme.cfg', 'cursor.cfg', 'workspaceSnaps.json']);

function sanitizeStoragePath(name) {
  const base = path.basename(name);
  if (!ALLOWED_FILES.has(base)) throw new Error('invalid filename');
  return path.join(STORAGE_DIR, base);
}

const SETTINGS_FILE = sanitizeStoragePath('protonSettings.json');
const THEME_FILE = sanitizeStoragePath('theme.cfg');
const CURSOR_FILE = sanitizeStoragePath('cursor.cfg');
const WORKSPACE_FILE = sanitizeStoragePath('workspaceSnaps.json');

async function loadAIConfig() {
  try {
    const row = (await query("SELECT value FROM preferences WHERE key='ai_config'"))[0];
    if (row && row.value) return JSON.parse(row.value);
  } catch (err) {
    console.error('Failed to load AI config', err);
  }
  return null;
}

async function saveAIConfig(config) {
  try {
    const val = JSON.stringify(config);
    await execute(
      'INSERT INTO preferences(key,value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=?',
      ['ai_config', val, val],
    );
  } catch (err) {
    console.error('Failed to save AI config', err);
    throw err;
  }
}

function sanitizeUserPath(p) {
  if (typeof p !== 'string' || p.includes('\0')) throw new Error('invalid path');
  const resolved = path.resolve(p);
  const allowed = STORAGE_DIR;
  if (resolved !== allowed && !resolved.startsWith(allowed + path.sep)) {
    throw new Error('invalid path');
  }
  return resolved;
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load settings', err);
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
  } catch (err) {
    console.error('Failed to load theme from DB', err);
  }
  try {
    return fs.readFileSync(THEME_FILE, 'utf8').trim();
  } catch (err) {
    console.error('Failed to load theme file', err);
    return 'dark';
  }
}

async function saveTheme(theme) {
  try {
    await execute(
      'INSERT INTO preferences(key,value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=?',
      ['theme', theme, theme],
    );
  } catch (err) {
    console.error('Failed to save theme to DB', err);
  }
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.writeFileSync(THEME_FILE, theme);
  } catch (err) {
    console.error('Failed to write theme file', err);
    // ignore
  }
}

async function loadCursor() {
  try {
    const row = (await query("SELECT value FROM preferences WHERE key='cursor'"))[0];
    if (row && (row.value === 'light' || row.value === 'dark')) return row.value;
  } catch (err) {
    console.error('Failed to load cursor from DB', err);
  }
  try {
    return fs.readFileSync(CURSOR_FILE, 'utf8').trim();
  } catch (err) {
    console.error('Failed to load cursor file', err);
    return 'light';
  }
}

async function saveCursor(cur) {
  try {
    await execute(
      'INSERT INTO preferences(key,value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=?',
      ['cursor', cur, cur],
    );
  } catch (err) {
    console.error('Failed to save cursor to DB', err);
  }
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.writeFileSync(CURSOR_FILE, cur);
  } catch (err) {
    console.error('Failed to write cursor file', err);
    // ignore
  }
}

function loadWorkspaces() {
  try {
    return JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveWorkspaces() {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(workspaceSnaps, null, 2));
  } catch {
    // ignore
  }
}

let workspaceSnaps = loadWorkspaces();

const API_TOKEN = process.env.API_TOKEN || '';

function checkToken(req, res, next) {
  if (!API_TOKEN) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (token === API_TOKEN) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

const app = express();
app.use(express.json());

const server = createServer(app);

initDb();
patternAlertService.loadProfile().catch(err => {
  console.error('Failed to load pattern profile', err);
});

const PHONE_BRIDGE_URL = process.env.PHONE_BRIDGE_URL || 'http://localhost:3002';
const PROXY_TIMEOUT = Number(process.env.PHONE_BRIDGE_TIMEOUT || 2000);
const MAX_RETRIES = 2;

app.use('/phonebridge', checkToken, (req, res) => {
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

app.post('/api/launch-proton', checkToken, async (req, res) => {
  let { path: exePath, version, prefix, wine } = req.body || {};

  if (!exePath) {
    return res.status(400).json({ error: 'path required' });
  }

  try {
    exePath = sanitizeUserPath(exePath);
  } catch (err) {
    console.error('Invalid path provided', err);
    return res.status(400).json({ error: 'invalid path' });
  }

  const risk = scoreExecutable(exePath);
  threatPredictScore = risk;
  if (risk > RISK_THRESHOLD) {
    return res.status(403).json({ error: 'blocked by sandbox', score: risk });
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

app.get('/api/cursor', async (req, res) => {
  res.json({ cursor: await loadCursor() });
});

app.post('/api/cursor', async (req, res) => {
  const { cursor } = req.body || {};
  if (cursor !== 'light' && cursor !== 'dark') {
    return res.status(400).json({ error: 'invalid cursor' });
  }
  await saveCursor(cursor);
  res.json({ success: true });
});

app.get('/api/aiconfig', async (req, res) => {
  res.json({ config: await loadAIConfig() });
});

app.post('/api/aiconfig', async (req, res) => {
  const { config } = req.body || {};
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'invalid config' });
  }
  await saveAIConfig(config);
  res.json({ success: true });
});

// --- ConverseAI ---
let converseSession = null;
app.post('/api/converseai', async (req, res) => {
  const { message, toneMatch } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const mod = await import('../services/cloudAIService.ts');
    if (!converseSession) {
      converseSession = await mod.createCloudChatSession('gemini', process.env.CLOUD_API_KEY || '');
    }
    let finalMsg = String(message);
    if (toneMatch) {
      finalMsg = `Match my style and reply accordingly.\n${message}`;
    }
    let reply = '';
    for await (const chunk of mod.sendMessageStream(converseSession, finalMsg)) {
      reply += chunk;
    }
    res.json({ reply });
  } catch (err) {
    console.error('converseai error', err);
    res.json({ reply: `Echo: ${message || ''}` });
  }
});

app.post('/api/converseai/digest', async (req, res) => {
  const { messages } = req.body || {};
  const text = Array.isArray(messages) ? messages.map(m => m.text || '').join('\n') : '';
  try {
    const mod = await import('../services/modelManager.ts');
    const digest = text ? await mod.summarize(text) : '';
    res.json({ digest });
  } catch (err) {
    console.error('digest error', err);
    res.status(500).json({ error: 'digest failed' });
  }
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

app.post('/api/inboxai/score', async (req, res) => {
  const { id, score } = req.body || {};
  await execute('UPDATE emails SET score=? WHERE id=?', [Number(score), Number(id)]);
  res.json({ success: true });
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

    const title = (text.match(/<title>([^<]+)<\/title>/i) || [null, ''])[1].trim();
    const author = (
      text.match(/<meta[^>]*name=['"]author['"][^>]*content=['"]([^'"]+)['"]/i) || [null, '']
    )[1].trim();
    const published = (
      text.match(
        /<meta[^>]*property=['"]article:published_time['"][^>]*content=['"]([^'"]+)['"]/i,
      ) || [null, '']
    )[1].trim();
    const citationsRaw = Array.from(
      text.matchAll(/<a[^>]*href=['"]([^'"]+)['"][^>]*>(.*?)<\/a>/gi),
    )
      .slice(0, 5)
      .map(m => ({ text: m[2].replace(/<[^>]+>/g, ''), url: m[1] }));
    const verified = await researchMate.verifyCitations(citationsRaw);
    const citations = citationsRaw.map((c, i) => ({ ...c, verified: verified[i] }));

    res.json({
      summary: text.slice(0, 200),
      meta: { title, author, published },
      citations,
    });
  } catch (err) {
    console.error('WebLens summarize error', err);
    res.status(500).json({ error: 'failed to fetch url' });
  }
});

// --- MediaSphere ---
app.use('/api/mediasphere', checkToken);
let firewallEnabled = true;
let threatScore = 0;
let threatPredictScore = 0;
let lastPatch = 0;

app.get('/api/mediasphere/media', (req, res) => {
  const dir = path.join(STORAGE_DIR, 'media');
  try {
    const items = fs
      .readdirSync(dir)
      .filter(f => !fs.statSync(path.join(dir, f)).isDirectory())
      .map((f, i) => ({ id: i + 1, title: f }));
    res.json({ items });
  } catch (err) {
    console.error('Failed to list media', err);
    res.status(500).json({ error: 'failed to list media' });
  }
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
    res.status(404).json({ error: 'file not found' });
  } catch (err) {
    console.error('Media analysis error', err);
    res.status(500).json({ error: 'analysis failed' });
  }
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

async function analyzeBitrate(file) {
  return new Promise(resolve => {
    const p = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=bit_rate',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ]);
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.on('close', () => {
      const br = parseInt(out.trim(), 10) || 0;
      let recommended = 'original';
      if (br > 8000000) recommended = '8000k';
      else if (br > 4000000) recommended = '4000k';
      else if (br > 2000000) recommended = '2000k';
      resolve({ bitrate: br, recommended });
    });
    p.on('error', () => resolve({ bitrate: 0, recommended: 'unknown' }));
  });
}

async function createRecap(file) {
  const { chapters } = await detectScenes(file);
  const times = chapters.slice(0, 3).map(c => c.start);
  if (!times.length) return { result: 'no scenes' };
  const outFile = path.join(os.tmpdir(), 'recap.mp4');
  return new Promise(resolve => {
    const args = [
      '-i', file,
      '-t', '15',
      '-c', 'copy',
      outFile,
      '-y',
    ];
    const p = spawn('ffmpeg', args);
    p.on('close', () => resolve({ result: outFile }));
    p.on('error', () => resolve({ result: '' }));
  });
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
    res.status(404).json({ error: 'file not found' });
  } catch (err) {
    console.error('Scene detection error', err);
    res.status(500).json({ error: 'failed to detect scenes' });
  }
});

app.post('/api/mediasphere/bitrate', async (req, res) => {
  const { id } = req.body || {};
  const dir = path.join(STORAGE_DIR, 'media');
  try {
    const files = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory());
    const file = files[id - 1];
    if (file) {
      const data = await analyzeBitrate(path.join(dir, file));
      return res.json(data);
    }
    res.status(404).json({ error: 'file not found' });
  } catch (err) {
    console.error('Bitrate analysis error', err);
    res.status(500).json({ error: 'bitrate analysis failed' });
  }
});

app.post('/api/mediasphere/recap', async (req, res) => {
  const { id } = req.body || {};
  const dir = path.join(STORAGE_DIR, 'media');
  try {
    const files = fs.readdirSync(dir).filter(f => !fs.statSync(path.join(dir, f)).isDirectory());
    const file = files[id - 1];
    if (file) {
      const data = await createRecap(path.join(dir, file));
      return res.json(data);
    }
    res.status(404).json({ error: 'file not found' });
  } catch (err) {
    console.error('Recap creation error', err);
    res.status(500).json({ error: 'recap failed' });
  }
});

// --- SoundScape ---
app.get('/api/soundscape/tracks', (req, res) => {
  const dir = path.join(STORAGE_DIR, 'music');
  try {
    const tracks = fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.mp3'))
      .map((f, i) => ({ id: i + 1, title: path.parse(f).name, artist: 'Unknown' }));
    res.json({ tracks });
  } catch (err) {
    console.error('Failed to list tracks', err);
    res.status(500).json({ error: 'failed to list tracks' });
  }
});

// --- VisionVault ---
const demoImages = [
  'https://placekitten.com/200/200',
  'https://placekitten.com/200/201',
];

app.get('/api/visionvault/images', (req, res) => {
  const dir = path.join(STORAGE_DIR, 'images');
  try {
    let images = fs
      .readdirSync(dir)
      .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
      .map(f => path.join('/images', f));
    if (images.length === 0) images = demoImages;
    res.json({ images });
  } catch (err) {
    console.error('Failed to list images', err);
    res.status(500).json({ error: 'failed to list images' });
  }
});

app.get('/api/visionvault/index', (req, res) => {
  try {
    const p = path.join(STORAGE_DIR, 'vision_index.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return res.json(data);
  } catch (err) {
    console.error('Failed to read vision index', err);
    return res.status(500).json({ error: 'failed to read index' });
  }
});

let imageproc = null;
try {
  imageproc = ffi.Library('./libimageproc', {
    enhance_image: ['int', ['string', 'string', 'string']],
  });
} catch (err) {
  console.log('Imageproc library not loaded:', err.message);
}

app.post('/api/visionvault/enhance', (req, res) => {
  const { src, filter } = req.body || {};
  if (!src) return res.status(400).json({ error: 'src required' });
  const base = src.replace(/^\/images\//, '');
  const inPath = path.join(STORAGE_DIR, 'images', base);
  const ext = path.extname(inPath);
  const outFile = path.basename(inPath, ext) + '_enh' + ext;
  const outPath = path.join(STORAGE_DIR, 'images', outFile);
  try {
    if (imageproc) {
      const ret = imageproc.enhance_image(inPath, outPath, filter || 'auto');
      if (ret !== 0) throw new Error('proc fail');
    } else {
      fs.copyFileSync(inPath, outPath);
    }
    return res.json({ src: '/images/' + outFile });
  } catch (err) {
    console.log('Enhance failed', err.message);
    return res.status(500).json({ error: 'enhance failed' });
  }
});

app.get('/api/visionvault/ar_memories', (req, res) => {
  try {
    const p = path.join(STORAGE_DIR, 'vision_ar_memories.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return res.json(data);
  } catch (err) {
    console.error('Failed to read AR memories', err);
    return res.status(500).json({ error: 'failed to read memories' });
  }
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

app.get('/api/securecore/threat', (req, res) => {
  res.json({ score: threatScore });
});

app.get('/api/securecore/threatpredict', (req, res) => {
  res.json({ score: threatPredictScore });
});

app.post('/api/securecore/train', (req, res) => {
  const metrics = req.body?.metrics;
  if (!metrics) return res.status(400).json({ error: 'metrics required' });
  try {
    patternAlertService.train(metrics);
    res.json({ success: true });
  } catch (err) {
    console.error('train error', err);
    res.status(500).json({ error: 'train failed' });
  }
});

app.post('/api/securecore/predict', (req, res) => {
  const metrics = req.body?.metrics;
  if (!metrics) return res.status(400).json({ error: 'metrics required' });
  try {
    const score = patternAlertService.predict(metrics);
    res.json({ score });
  } catch (err) {
    console.error('predict error', err);
    res.status(500).json({ error: 'predict failed' });
  }
});

app.post('/api/autopatch/run', (req, res) => {
  lastPatch = Date.now();
  res.json({ success: true });
});

app.get('/api/autopatch/last', (req, res) => {
  res.json({ last: lastPatch });
});

// --- Eco Detect ---
function detectIdleDrain(callback) {
  exec('ps -eo pid,pcpu,pmem,comm --no-headers', (err, stdout) => {
    if (err) return callback([]);
    const procs = stdout
      .trim()
      .split('\n')
      .map(line => {
        const [pid, cpu, mem, ...cmd] = line.trim().split(/\s+/);
        return { pid: Number(pid), cpu: parseFloat(cpu), mem: parseFloat(mem), cmd: cmd.join(' ') };
      })
      .filter(p => p.cpu > 20 || p.mem > 50);
    callback(procs);
  });
}

app.get('/api/eco/detect', (req, res) => {
  detectIdleDrain(list => res.json({ list }));
});

app.post('/api/eco/kill', (req, res) => {
  const pid = Number(req.body?.pid);
  if (!pid) return res.status(400).json({ error: 'pid required' });
  try {
    process.kill(pid);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to kill process', err);
    res.status(500).json({ error: 'failed' });
  }
});

// --- AppForge ---
app.post('/api/appforge/build', (req, res) => {
  res.json({ success: true });
});

// --- SpaceManager ---
app.post('/api/spacemanager/snapshot', (req, res) => {
  const { name, layout } = req.body || {};
  if (!name || !Array.isArray(layout)) return res.status(400).json({ error: 'invalid' });
  workspaceSnaps[name] = layout;
  saveWorkspaces();
  res.json({ success: true });
});

app.get('/api/spacemanager/snapshot', (req, res) => {
  const name = String(req.query.name || 'default');
  res.json({ layout: workspaceSnaps[name] || [] });
});

app.get('/api/spacemanager/snapshots', (req, res) => {
  res.json({ workspaces: Object.keys(workspaceSnaps) });
});

app.get('/api/spacemanager/groups', (req, res) => {
  const name = String(req.query.workspace || 'default');
  const snap = workspaceSnaps[name] || [];
  const groups = Array.from(new Set(snap.map(w => w.group ?? 0))).sort((a,b) => a - b);
  res.json({ groups });
});

app.post('/api/spacemanager/switch', (req, res) => {
  const { workspace, group } = req.body || {};
  const snap = workspaceSnaps[workspace];
  if (!snap) return res.status(404).json({ error: 'workspace not found' });
  const g = Number(group);
  const windows = snap.filter(w => (w.group ?? 0) === g);
  res.json({ windows });
});

// --- Pulse Monitor ---
app.get('/api/pulsemonitor/status', (req, res) => {
  const bpm = Math.round(os.loadavg()[0] * 10 + 70);
  res.json({ bpm });
});

const wss = new WebSocketServer({ server, path: '/ws/pulse' });
const insightsWss = new WebSocketServer({ server, path: '/ws/insights' });

function collectMetrics() {
  const base = {
    bpm: Math.round(os.loadavg()[0] * 10 + 70),
    load: os.loadavg()[0],
    memory: 1 - os.freemem() / os.totalmem(),
    threat: threatScore,
  };
  const anomaly = patternAlertService.process(base);
  return { ...base, anomaly };
}

setInterval(() => {
  const msg = JSON.stringify(collectMetrics());
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}, 1000);

function collectInsights() {
  return {
    energy: Math.random(),
    tempo: Math.floor(Math.random() * 120) + 60,
  };
}

setInterval(() => {
  const msg = JSON.stringify(collectInsights());
  insightsWss.clients.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}, 1000);

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

app.get('/api/filetags', async (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path required' });
  let file;
  try {
    file = sanitizeUserPath(String(p));
  } catch {
    return res.status(400).json({ error: 'invalid path' });
  }
  const row = (await query('SELECT tags FROM tags WHERE path=?', [file]))[0];
  const tags = row && row.tags ? JSON.parse(row.tags) : [];
  res.json({ tags });
});

app.post('/api/filetags', async (req, res) => {
  const { path: p, tags } = req.body || {};
  if (!p) return res.status(400).json({ error: 'path required' });
  let file;
  try {
    file = sanitizeUserPath(String(p));
  } catch {
    return res.status(400).json({ error: 'invalid path' });
  }
  const text = JSON.stringify(Array.isArray(tags) ? tags : []);
  await execute(
    'INSERT INTO tags(path, tags) VALUES(?, ?) ON CONFLICT(path) DO UPDATE SET tags=?',
    [file, text, text],
  );
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
if (!process.env.VITEST) {
  server.listen(PORT, () => {
    console.log(`Proton launcher server listening on port ${PORT}`);
  });
}

export default app;
export function setThreatScore(score) { threatScore = score; }
export function setThreatPredictScore(score) { threatPredictScore = score; }
export { sanitizeUserPath, sanitizeStoragePath, STORAGE_DIR, loadAIConfig, saveAIConfig };
