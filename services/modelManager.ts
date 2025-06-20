import { createCloudChatSession, sendMessageStream as sendCloudStream, CloudProvider, CloudChatSession } from './cloudAIService';
import { createQwenChatSession, QwenChatSession } from './qwenService';
import { AIModelPreference, ChatMessage } from '../types';
import { memoryHubService } from './memoryHubService';
import { agentOrchestrator } from './agentOrchestrator';
import { pipeline } from '@xenova/transformers';
import { loadOnnxRuntime, loadGgmlRuntime, OnnxRuntimeExports, GgmlRuntimeExports } from '@/wasm/wasmLoader';

let summarizer: any = null;
let classifier: any = null;

export async function loadOnnx() {
  return loadOnnxRuntime();
}

export async function loadGgml() {
  return loadGgmlRuntime();
}

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
  message: string
): AsyncGenerator<string> {
  memoryHubService.addEntry(`[user] ${message}`);
  let full = '';
  if (session.type === 'cloud' && session.cloudSession) {
    for await (const chunk of sendCloudStream(session.cloudSession, message)) {
      full += chunk;
      yield chunk;
    }
  } else if (session.type === 'local' && session.localSession) {
    for await (const chunk of session.localSession.sendMessageStream(message)) {
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
    summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
  }
  const result = await summarizer(text);
  return Array.isArray(result) ? result[0].summary_text : result.summary_text;
};

export const tagText = async (
  text: string,
  labels: string[]
): Promise<string[]> => {
  if (!classifier) {
    classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
  }
  const result = await classifier(text, { candidate_labels: labels });
  return (result.labels as string[]).slice(0, 3);
};

agentOrchestrator.registerAction('model.summarize', params => summarize(String(params?.text || '')));
agentOrchestrator.registerAction('model.tag_text', params => tagText(String(params?.text || ''), (params?.labels as string[]) || []));

export type { OnnxRuntimeExports, GgmlRuntimeExports };
export { loadOnnxRuntime, loadGgmlRuntime, loadOnnx, loadGgml };
