import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { sanitizeArgs } from '../cli/utils/validate.ts';

let offline = false;
function loadOffline() {
  const locations = [
    '/EFI/PHILLOS/offline.cfg',
    path.resolve(__dirname, '../storage/offline.cfg'),
  ];
  for (const p of locations) {
    try {
      const data = fs.readFileSync(p, 'utf8').trim();
      if (/^(1|on|yes|true)$/i.test(data)) {
        offline = true;
        console.log(
          'Offline mode enabled - Proton downloads disabled. Pre-populate dist/proton.'
        );
        break;
      }
    } catch {
      /* ignore */
    }
  }
}

loadOffline();

export async function downloadProton(base, version) {
  const url = process.env.PROTON_DOWNLOAD_URL ||
    `https://steamcdn-a.akamaihd.net/client/${version}.tar.gz`;

  const cacheDir = process.env.PHILLOS_CACHE_DIR || 'cache';
  await fs.promises.mkdir(cacheDir, { recursive: true });
  await fs.promises.mkdir(base, { recursive: true });
  const cacheFile = path.join(cacheDir, `${version}.tar.gz`);

  if (!fs.existsSync(cacheFile)) {
    if (url.startsWith('file://')) {
      const src = new URL(url).pathname;
      await fs.promises.copyFile(src, cacheFile);
    } else if (offline) {
      throw new Error(
        `Offline mode active - missing ${version}.tar.gz. Pre-populate dist/proton`
      );
    } else {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(cacheFile);
        https.get(url, res => {
          if ((res.statusCode || 0) >= 400) {
            reject(new Error(`Failed to download Proton: ${res.statusCode}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      });
    }
  }

  await new Promise((resolve, reject) => {
    const tar = spawn('tar', ['-xf', cacheFile, '-C', base]);
    tar.on('error', reject);
    tar.on('exit', code => {
      code === 0 ? resolve() : reject(new Error(`tar exited with code ${code}`));
    });
  });
}

export class ProtonLauncher {
  constructor(options = {}) {
    this.options = options;
    if (!this.options.protonDir) {
      this.options.protonDir = path.resolve(__dirname, '../dist/proton');
    }
  }

  async resolveProtonPath() {
    const base = this.options.protonDir;
    const version = this.options.version || 'Proton-8.0';
    const protonPath = path.join(base, version, 'proton');
    if (fs.existsSync(protonPath)) {
      return protonPath;
    }
    await downloadProton(base, version);
    return fs.existsSync(protonPath) ? protonPath : null;
  }

  async launch(executable, args = []) {
    const resolvedExe = path.resolve(executable);
    if (!fs.existsSync(resolvedExe) || !fs.statSync(resolvedExe).isFile()) {
      throw new Error(`Executable not found: ${executable}`);
    }

    sanitizeArgs([executable, ...args]);

    let runner = await this.resolveProtonPath();
    if (!runner) {
      runner = this.options.wineBinary || 'wine';
    }
    const env = { ...process.env };
    if (this.options.prefix) {
      env.WINEPREFIX = path.resolve(this.options.prefix);
    }
    return new Promise((resolve, reject) => {
      const child = spawn(runner, [resolvedExe, ...args], { env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', code => {
        code === 0 ? resolve() : reject(new Error(`${runner} exited with code ${code}`));
      });
    });
  }
}

export const createProtonLauncher = (options = {}) => new ProtonLauncher(options);

// Simple CLI usage
if (require.main === module) {
  const { parseArgs } = require('node:util');

  const parsed = parseArgs({
    options: {
      protonDir: { type: 'string' },
      version: { type: 'string' },
      prefix: { type: 'string' },
      wine: { type: 'string' },
    },
    allowPositionals: true,
  });

  const exe = parsed.positionals[0];
  const extraArgs = parsed.positionals.slice(1);

  if (!exe) {
    console.error('Usage: node protonLauncher.js <exe> [--protonDir DIR --version V] [--prefix PATH] [--wine /path/to/wine]');
    process.exit(1);
  }

  const resolvedExe = path.resolve(exe);
  if (!fs.existsSync(resolvedExe) || !fs.statSync(resolvedExe).isFile()) {
    console.error(`Executable not found: ${exe}`);
    process.exit(1);
  }

  try {
    sanitizeArgs([exe, ...extraArgs]);
  } catch {
    console.error('Unsafe arguments detected');
    process.exit(1);
  }

  const launcher = createProtonLauncher({
    protonDir: parsed.values.protonDir,
    version: parsed.values.version,
    prefix: parsed.values.prefix,
    wineBinary: parsed.values.wine,
  });

  launcher.launch(exe, extraArgs).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
