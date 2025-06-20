import { spawn, spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { join } from 'path';
import * as fs from 'fs';

export class WhisperService {
  constructor(private python: string = process.env.WHISPER_PYTHON || 'python3') {}

  static isAvailable(): boolean {
    try {
      const res = spawnSync('python3', ['-V']);
      return res.status === 0;
    } catch {
      return false;
    }
  }

  async transcribe(audio: Blob): Promise<string> {
    const tmpPath = join(tmpdir(), `whisper-${randomUUID()}.webm`);
    const buffer = Buffer.from(await audio.arrayBuffer());
    await fs.promises.writeFile(tmpPath, buffer);
    return new Promise((resolve, reject) => {
      const child = spawn(this.python, [join(__dirname, 'whisper_server.py'), tmpPath]);
      let out = '';
      let err = '';
      child.stdout.on('data', d => (out += d.toString()));
      child.stderr.on('data', d => (err += d.toString()));
      child.on('error', e => {
        fs.promises.unlink(tmpPath).catch(() => {});
        reject(e);
      });
      child.on('close', code => {
        fs.promises.unlink(tmpPath).catch(() => {});
        if (code === 0) {
          resolve(out.trim());
        } else {
          reject(new Error(err || `whisper_server exited with code ${code}`));
        }
      });
    });
  }
}
