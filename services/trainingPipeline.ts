import express from 'express';
import { LocalStorage } from 'node-localstorage';
import ollama from 'ollama';
import { memoryService } from './memoryService';
import { memoryHubService } from './memoryHubService';
import { agentOrchestrator } from './agentOrchestrator';

const STORAGE_PATH = process.env.PHILLOS_STORAGE_DIR || './storage';
(globalThis as any).localStorage = new LocalStorage(STORAGE_PATH) as any;

memoryHubService.init();

const TRAINING_ENABLED = process.env.PHILLOS_TRAINING_ENABLED !== 'false';
const TRAINING_INTERVAL = parseInt(process.env.PHILLOS_TRAINING_INTERVAL_MS || '3600000', 10);
const BASE_MODEL = process.env.PHILLOS_BASE_MODEL || 'qwen3:1.7b';
const FINETUNED_MODEL = process.env.PHILLOS_FINETUNED_MODEL || 'qwen3-finetuned';

class TrainingPipeline {
  private interval: NodeJS.Timeout | null = null;
  private running = false;
  enabled = TRAINING_ENABLED;
  intervalMs = TRAINING_INTERVAL;

  start(periodMs = this.intervalMs) {
    if (!this.enabled || this.running) return;
    this.intervalMs = periodMs;
    this.interval = setInterval(() => this.run(), this.intervalMs);
    this.running = true;
    this.run();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.running = false;
  }

  updateConfig(cfg: { enabled?: boolean; intervalMs?: number }) {
    if (cfg.enabled !== undefined) {
      this.enabled = cfg.enabled;
      if (!this.enabled) this.stop();
    }
    if (cfg.intervalMs !== undefined) {
      this.intervalMs = cfg.intervalMs;
      if (this.running) {
        clearInterval(this.interval!);
        this.interval = setInterval(() => this.run(), this.intervalMs);
      }
    }
  }

  status() {
    return { running: this.running, enabled: this.enabled, intervalMs: this.intervalMs };
  }

  private async run() {
    if (!this.enabled) return;
    const msgs = memoryService.getMessages();
    if (!msgs.length) return;
    const messages = msgs.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.text,
    }));

    memoryHubService.addEntry(`Training started with ${messages.length} messages`);

    try {
      const stream = await ollama.create({
        model: FINETUNED_MODEL,
        from: BASE_MODEL,
        stream: true,
        messages,
      }) as any;

      for await (const p of stream) {
        memoryHubService.addEntry(`Progress: ${p.completed}/${p.total}`);
      }

      memoryHubService.addEntry('Training complete');
    } catch (err) {
      memoryHubService.addEntry('Training error: ' + (err as Error).message);
      console.error('Training pipeline error:', err);
    }
  }
}

export const trainingPipeline = new TrainingPipeline();

agentOrchestrator.registerAction('training.status', () => trainingPipeline.status());

const app = express();
app.use(express.json());

app.post('/training/start', (_req, res) => {
  trainingPipeline.start();
  res.json(trainingPipeline.status());
});

app.post('/training/stop', (_req, res) => {
  trainingPipeline.stop();
  res.json(trainingPipeline.status());
});

app.get('/training/status', (_req, res) => {
  res.json(trainingPipeline.status());
});

app.get('/training/config', (_req, res) => {
  res.json(trainingPipeline.status());
});

app.post('/training/config', (req, res) => {
  const { enabled, intervalMs } = req.body || {};
  trainingPipeline.updateConfig({ enabled, intervalMs });
  res.json(trainingPipeline.status());
});

const PORT = process.env.TRAINING_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Training pipeline server listening on ${PORT}`);
  if (trainingPipeline.enabled) trainingPipeline.start();
});

export default app;
