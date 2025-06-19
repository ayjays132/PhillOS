import { QwenChatSession, createQwenChatSession } from './qwenService';
import { ChatMessage } from '../types';

export interface AgentAction {
  action: string;
  parameters?: Record<string, unknown>;
}

export class AgentService {
  private session: QwenChatSession | null = null;

  async init(history?: ChatMessage[]) {
    this.session = await createQwenChatSession(history);
  }

  async processCommand(command: string): Promise<AgentAction | null> {
    if (!this.session) {
      await this.init();
    }
    const prompt = `You are the PhillOS Agent. Interpret the user's request and respond ONLY with a JSON object describing the action to take. Example format: {"action": "open_app", "parameters": {"app": "files"}}. If the request is a search query, use action 'search' with a 'query' parameter. Request: ${command}`;
    const stream = this.session!.sendMessageStream(prompt);
    let response = '';
    for await (const chunk of stream) {
      response += chunk;
    }
    try {
      const jsonStart = response.indexOf('{');
      const json = response.slice(jsonStart);
      return JSON.parse(json) as AgentAction;
    } catch {
      return null;
    }
  }
}

export const agentService = new AgentService();
