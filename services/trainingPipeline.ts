import express from 'express';
import { LocalStorage } from 'node-localstorage';
import ollama from 'ollama';
import { memoryHubService } from './memoryHubService';

const STORAGE_PATH = process.env.PHILLOS_STORAGE_DIR || './storage';
(globalThis as any).localStorage = new LocalStorage(STORAGE_PATH) as any;

memoryHubService.init();

class TrainingPipeline {
  private interval: NodeJS.Timeout | null = null;
  private running = false;

  start(periodMs = 600000) {
    if (this.running) return;
    this.interval = setInterval(() => this.run(), periodMs);
    this.running = true;
    this.run();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.running = false;
  }

  status() {
    return { running: this.running };
  }

  private async run() {
    const windows = memoryHubService.getWindows();
    if (!windows.length) return;
    const text = windows.map(w => w.content).join('\n');
    const prompt = `Summarize the following user context:\n${text}\nSummary:`;
    try {
      const resp = await ollama.generate({ model: 'qwen3:1.7b', prompt });
      console.log('Memory summary:', resp.response.trim());
    } catch (err) {
      console.error('Training pipeline error:', err);
    }
  }
}

export const trainingPipeline = new TrainingPipeline();

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

const PORT = process.env.TRAINING_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Training pipeline server listening on ${PORT}`);
});

export default app;
