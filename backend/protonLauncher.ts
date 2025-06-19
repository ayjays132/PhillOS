import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import os from 'os';

export interface ProtonOptions {
  protonDir?: string;       // Directory containing Proton installations
  version?: string;         // Specific Proton version directory name
  prefix?: string;          // WINE prefix path
  wineBinary?: string;      // Path to Wine executable (fallback if no Proton)
}

export class ProtonLauncher {
  constructor(private options: ProtonOptions) {
    if (!this.options.protonDir) {
      this.options.protonDir = path.resolve(__dirname, '../dist/proton');
    }
  }

  private async downloadProton(base: string, version: string): Promise<void> {
    const url = process.env.PROTON_DOWNLOAD_URL ||
      `https://steamcdn-a.akamaihd.net/client/${version}.tar.gz`;
    await fs.promises.mkdir(base, { recursive: true });
    const tmp = path.join(os.tmpdir(), `${version}.tar.gz`);
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(tmp);
      https.get(url, res => {
        if ((res.statusCode || 0) >= 400) {
          reject(new Error(`Failed to download Proton: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    });
    await new Promise<void>((resolve, reject) => {
      const tar = spawn('tar', ['-xf', tmp, '-C', base]);
      tar.on('error', reject);
      tar.on('exit', code => {
        code === 0 ? resolve() : reject(new Error(`tar exited with code ${code}`));
      });
    });
  }

  private async resolveProtonPath(): Promise<string | null> {
    const base = this.options.protonDir!;
    const version = this.options.version || 'Proton-8.0';
    const protonPath = path.join(base, version, 'proton');
    if (fs.existsSync(protonPath)) {
      return protonPath;
    }
    try {
      await this.downloadProton(base, version);
    } catch (err) {
      console.error(err);
      return null;
    }
    return fs.existsSync(protonPath) ? protonPath : null;
  }

  async launch(
    executable: string,
    args: string[] = [],
    opts: Partial<Pick<ProtonOptions, 'version' | 'prefix'>> = {}
  ): Promise<void> {
    if (opts.version) this.options.version = opts.version;
    if (opts.prefix) this.options.prefix = opts.prefix;
    const resolvedExe = path.resolve(executable);
    if (!fs.existsSync(resolvedExe) || !fs.statSync(resolvedExe).isFile()) {
      throw new Error(`Executable not found: ${executable}`);
    }

    const unsafe = /[;&|`$><]/;
    if (args.some(a => unsafe.test(a))) {
      throw new Error('Unsafe arguments detected');
    }

    let runner = await this.resolveProtonPath();
    if (!runner) {
      runner = this.options.wineBinary || 'wine';
    }
    const env = { ...process.env };
    if (this.options.prefix) {
      env.WINEPREFIX = path.resolve(this.options.prefix);
    }
    return new Promise((resolve, reject) => {
      const child = spawn(runner!, [resolvedExe, ...args], { env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', code => {
        code === 0 ? resolve() : reject(new Error(`${runner} exited with code ${code}`));
      });
    });
  }
}

export const createProtonLauncher = (options: ProtonOptions) => new ProtonLauncher(options);

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

  const unsafe = /[;&|`$><]/;
  if (extraArgs.some(a => unsafe.test(a))) {
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
