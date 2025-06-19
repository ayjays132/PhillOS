import { spawn } from 'child_process';
import path from 'path';

export interface ProtonOptions {
  protonDir: string;       // Directory containing Proton installations
  version?: string;        // Specific Proton version directory name
  prefix?: string;         // WINE prefix path
}

export class ProtonLauncher {
  constructor(private options: ProtonOptions) {}

  private resolveProtonPath(): string {
    const base = this.options.protonDir;
    if (this.options.version) {
      return path.join(base, this.options.version, 'proton');
    }
    return path.join(base, 'proton');
  }

  launch(executable: string, args: string[] = []): Promise<void> {
    const proton = this.resolveProtonPath();
    const env = { ...process.env };
    if (this.options.prefix) {
      env.WINEPREFIX = path.resolve(this.options.prefix);
    }
    return new Promise((resolve, reject) => {
      const child = spawn(proton, [executable, ...args], { env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', code => {
        code === 0 ? resolve() : reject(new Error(`Proton exited with code ${code}`));
      });
    });
  }
}

export const createProtonLauncher = (options: ProtonOptions) => new ProtonLauncher(options);
