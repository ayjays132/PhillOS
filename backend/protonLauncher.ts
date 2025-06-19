import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface ProtonOptions {
  protonDir?: string;       // Directory containing Proton installations
  version?: string;         // Specific Proton version directory name
  prefix?: string;          // WINE prefix path
  wineBinary?: string;      // Path to Wine executable (fallback if no Proton)
}

export class ProtonLauncher {
  constructor(private options: ProtonOptions) {}

  private resolveProtonPath(): string {
    if (this.options.wineBinary) {
      return this.options.wineBinary;
    }
    if (!this.options.protonDir) {
      return 'wine';
    }
    const base = this.options.protonDir;
    if (this.options.version) {
      return path.join(base, this.options.version, 'proton');
    }
    return path.join(base, 'proton');
  }

  launch(executable: string, args: string[] = []): Promise<void> {
    const resolvedExe = path.resolve(executable);
    if (!fs.existsSync(resolvedExe) || !fs.statSync(resolvedExe).isFile()) {
      return Promise.reject(new Error(`Executable not found: ${executable}`));
    }

    const unsafe = /[;&|`$><]/;
    if (args.some(a => unsafe.test(a))) {
      return Promise.reject(new Error('Unsafe arguments detected'));
    }

    const runner = this.resolveProtonPath();
    const env = { ...process.env };
    if (this.options.prefix) {
      env.WINEPREFIX = path.resolve(this.options.prefix);
    }
    return new Promise((resolve, reject) => {
      const child = spawn(runner, [resolvedExe, ...args], { env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', code => {
        code === 0 ? resolve() : reject(new Error(`Proton exited with code ${code}`));
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
