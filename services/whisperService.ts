export class WhisperService {
  private pythonExecutable: string;

  constructor(python?: string) {
    const envPython = (typeof process !== 'undefined' && (process as any).env && (process as any).env.WHISPER_PYTHON) || undefined;
    this.pythonExecutable = python || envPython || 'python3';
  }

  static isAvailable(): boolean {
    try {
      // Avoid named import so Vite browser external doesn't error
      const cp: any = (typeof require !== 'undefined')
        ? require('child_process')
        : undefined;
      if (cp && typeof cp.spawnSync === 'function') {
        const res = cp.spawnSync('python3', ['-V']);
        return res && res.status === 0;
      }
      return false;
    } catch {
      return false;
    }
  }

  async transcribe(audio: Blob): Promise<string> {
    // Dynamic imports so browser build doesn't choke
    const [{ default: pathUrl }, cp, fsp] = await Promise.all([
      import('url'),
      import('child_process').then(mod => (mod as any)).catch(() => ({} as any)),
      import('fs/promises').then(mod => (mod as any)).catch(() => ({} as any)),
    ]);

    // Resolve temp path (Node only). In browsers this method should never be called.
    const tmpBase = '/tmp';
    const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2);
    const tmpPath = `${tmpBase}/whisper-${uuid}.webm`;

    // Convert Blob to Buffer (Node only)
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!fsp || typeof fsp.writeFile !== 'function' || !cp || typeof cp.spawn !== 'function') {
      throw new Error('Whisper backend not available in this environment');
    }

    await fsp.writeFile(tmpPath, buffer);

    const scriptUrl = new (pathUrl as any).URL('./whisper_server.py', import.meta.url);
    const scriptPath = (scriptUrl as any).pathname || String(scriptUrl);

    return new Promise((resolve, reject) => {
      const child = cp.spawn(this.pythonExecutable, [scriptPath, tmpPath]);
      let out = '';
      let err = '';
      child.stdout.on('data', (d: any) => (out += d.toString()));
      child.stderr.on('data', (d: any) => (err += d.toString()));
      child.on('error', async (e: any) => {
        try { await fsp.unlink(tmpPath); } catch {}
        reject(e);
      });
      child.on('close', async (code: number) => {
        try { await fsp.unlink(tmpPath); } catch {}
        if (code === 0) {
          resolve(out.trim());
        } else {
          reject(new Error(err || `whisper_server exited with code ${code}`));
        }
      });
    });
  }
}

export const whisperService = new WhisperService();

import { agentOrchestrator } from './agentOrchestrator';

agentOrchestrator.registerAction('whisper.transcribe', params => whisperService.transcribe(params?.audio as Blob));
