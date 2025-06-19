import { spawn } from 'child_process';
import path from 'path';

export class ProtonLauncher {
  constructor(options = {}) {
    this.options = options;
  }

  resolveProtonPath() {
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

  launch(executable, args = []) {
    const runner = this.resolveProtonPath();
    const env = { ...process.env };
    if (this.options.prefix) {
      env.WINEPREFIX = path.resolve(this.options.prefix);
    }
    return new Promise((resolve, reject) => {
      const child = spawn(runner, [executable, ...args], { env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', code => {
        code === 0 ? resolve() : reject(new Error(`Proton exited with code ${code}`));
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
