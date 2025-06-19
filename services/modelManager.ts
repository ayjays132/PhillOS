import { createCloudChatSession, sendMessageStream as sendCloudStream, CloudProvider, CloudChatSession } from './cloudAIService';
import { createQwenChatSession, QwenChatSession } from './qwenService';
import { AIModelPreference, ChatMessage } from '../types';
import { memoryHubService } from './memoryHubService';

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
