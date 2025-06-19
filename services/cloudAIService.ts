import type { GoogleGenAI, Chat, GenerateContentResponse, Part, Content } from "@google/genai";
import type OpenAI from 'openai';
import { ChatMessage } from '../types';

export type CloudProvider = 'gemini' | 'openai';

export interface CloudChatSession {
  provider: CloudProvider;
  apiKey: string;
  session: Chat | OpenAI.Chat.CompletionsCreateParams | null;
}

// Gemini setup
const createGeminiSession = async (apiKey: string, history?: ChatMessage[]): Promise<Chat | null> => {
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const formattedHistory: Content[] = history ? history.map(msg => ({
      role: msg.role === 'system' ? 'model' : (msg.role as 'user' | 'model'),
      parts: [{ text: msg.text }] as Part[]
    })) : [];
    return ai.chats.create({
      model: 'gemini-2.5-flash-preview-04-17',
      history: formattedHistory,
      config: {
        systemInstruction: 'You are PhillOS AI CoPilot, a helpful assistant.'
      }
    });
  } catch (error) {
    console.error('Failed to create Gemini session', error);
    return null;
  }
};

// OpenAI setup
const createOpenAISession = (apiKey: string, history?: ChatMessage[]): OpenAI.Chat.CompletionsCreateParams => {
  return {
    model: 'gpt-3.5-turbo',
    messages: history?.map(m => ({ role: m.role, content: m.text })) || [],
    stream: true,
  } as OpenAI.Chat.CompletionsCreateParams;
};

export const createCloudChatSession = async (provider: CloudProvider, apiKey: string, history?: ChatMessage[]): Promise<CloudChatSession | null> => {
  if (provider === 'gemini') {
    const chat = await createGeminiSession(apiKey, history);
    return chat ? { provider, apiKey, session: chat } : null;
  }
  if (provider === 'openai') {
    const session = createOpenAISession(apiKey, history);
    return { provider, apiKey, session };
  }
  return null;
};

export async function* sendMessageStream(session: CloudChatSession, message: string): AsyncGenerator<string> {
  if (session.provider === 'gemini') {
    const chat = session.session as Chat;
    const stream = await chat.sendMessageStream({ message });
    for await (const chunk of stream) {
      const text = (chunk as GenerateContentResponse).text || '';
      yield text;
    }
  } else if (session.provider === 'openai') {
    const params = session.session as OpenAI.Chat.CompletionsCreateParams;
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: session.apiKey });
    const iterable = await openai.chat.completions.create({ ...params, messages: [...params.messages, { role: 'user', content: message }] });
    for await (const chunk of iterable) {
      const text = chunk.choices[0]?.delta?.content || '';
      yield text;
    }
  }
}
