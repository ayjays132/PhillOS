import { createCloudChatSession, sendMessageStream as sendCloudStream, CloudProvider, CloudChatSession } from './cloudAIService';
import { createQwenChatSession, QwenChatSession } from './qwenService';
import { AIModelPreference, ChatMessage } from '../types';
import { memoryHubService } from './memoryHubService';
import { agentOrchestrator } from './agentOrchestrator';
import { pipeline } from '@xenova/transformers';

async function loadWasmSummarizer() {
  try {
    const mod = await import('@/wasm/summarizer');
    return await mod.loadSummarizer();
  } catch {
    return null;
  }
}

async function loadWasmClassifier() {
  try {
    const mod = await import('@/wasm/classifier');
    return await mod.loadClassifier();
  } catch {
    return null;
  }
}

let summarizer: any = null;
let classifier: any = null;

export interface ModelSession {
  type: AIModelPreference;
  cloudSession?: CloudChatSession;
  localSession?: QwenChatSession;
}

export const createModelSession = async (
  preference: AIModelPreference,
  options: { provider?: CloudProvider; apiKey?: string; history?: ChatMessage[] } = {}
): Promise<ModelSession | null> => {
  if (preference === 'cloud') {
    const provider = options.provider || 'gemini';
    const session = await createCloudChatSession(provider, options.apiKey || '', options.history);
    return session ? { type: 'cloud', cloudSession: session } : null;
  }
  try {
    const session = await createQwenChatSession(options.history);
    return { type: 'local', localSession: session };
  } catch {
    return null;
  }
};

export async function* sendModelMessageStream(
  session: ModelSession,
  message: string,
  options: { toneMatch?: boolean } = {}
): AsyncGenerator<string> {
  memoryHubService.addEntry(`[user] ${message}`);
  let finalMsg = message;
  if (options.toneMatch) {
    const style = memoryHubService.getStyleProfile();
    if (style) finalMsg = `${style}\n${message}`;
  }
  let full = '';
  if (session.type === 'cloud' && session.cloudSession) {
    for await (const chunk of sendCloudStream(session.cloudSession, finalMsg)) {
      full += chunk;
      yield chunk;
    }
  } else if (session.type === 'local' && session.localSession) {
    for await (const chunk of session.localSession.sendMessageStream(finalMsg)) {
      full += chunk;
      yield chunk;
    }
  }
  if (full.trim()) {
    memoryHubService.addEntry(`[model] ${full}`);
  }
}

export const summarize = async (text: string): Promise<string> => {
  if (!summarizer) {
    summarizer = await loadWasmSummarizer();
    if (!summarizer) {
      summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
    }
  }
  const result = await summarizer(text);
  return Array.isArray(result) ? result[0].summary_text : result.summary_text;
};

export const tagText = async (
  text: string,
  labels: string[]
): Promise<string[]> => {
  if (!classifier) {
    classifier = await loadWasmClassifier();
    if (!classifier) {
      classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
    }
  }
  const result = await classifier(text, { candidate_labels: labels });
  return (result.labels as string[]).slice(0, 3);
};

export type SummaryWorker = {
  update: (text: string) => void;
  stop: () => void;
};

export const createSummaryWorker = (
  onSummary: (bullets: string[]) => void,
  delay = 500
): SummaryWorker => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latest = '';
  let stopped = false;

  const run = async () => {
    const text = latest.trim();
    if (!text || stopped) {
      onSummary([]);
      return;
    }
    const summary = await summarize(text);
    const bullets = summary
      .split(/\n+/)
      .flatMap(line => line.split(/[.]/))
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => `• ${s}`);
    if (!stopped) onSummary(bullets);
  };

  const update = (text: string) => {
    latest = text;
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, delay);
  };

  const stop = () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };

  return { update, stop };
};

agentOrchestrator.registerAction('model.summarize', params => summarize(String(params?.text || '')));
agentOrchestrator.registerAction('model.tag_text', params => tagText(String(params?.text || ''), (params?.labels as string[]) || []));

export interface SystemMetrics {
  bpm: number;
  load: number;
  memory: number;
  threat: number;
}

type AnomalyHandler = (msg: string, metrics: SystemMetrics) => void;
const anomalyHandlers = new Set<AnomalyHandler>();
const history: SystemMetrics[] = [];

export function onAnomaly(handler: AnomalyHandler) {
  anomalyHandlers.add(handler);
}

export function offAnomaly(handler: AnomalyHandler) {
  anomalyHandlers.delete(handler);
}

export function processMetrics(m: SystemMetrics) {
  history.push(m);
  if (history.length > 30) history.shift();
  if (history.length < 5) return;
  const warn: string[] = [];
  const check = (key: keyof SystemMetrics, label: string) => {
    const vals = history.map(h => h[key]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length);
    if (Math.abs(m[key] - avg) > 2 * sd) warn.push(label);
  };
  check('load', 'High load');
  check('memory', 'Memory spike');
  check('bpm', 'BPM anomaly');
  check('threat', 'Threat spike');
  if (warn.length) {
    const message = warn.join(', ');
    anomalyHandlers.forEach(h => h(message, m));
  }
}

