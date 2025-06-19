import { ModelSession, createModelSession, sendModelMessageStream } from './modelManager';
import { ChatMessage, AIModelPreference } from '../types';
import { memoryService } from './memoryService';

export interface AgentAction {
  action: string;
  parameters?: Record<string, unknown>;
}

export class AgentService {
  private session: ModelSession | null = null;
  private preference: AIModelPreference = 'local';

  async init(preference: AIModelPreference = 'local') {
    this.preference = preference;
    const history = memoryService.getMessages();
    this.session = await createModelSession(preference, { history });
  }

  async processCommand(command: string, preference: AIModelPreference = this.preference): Promise<AgentAction | null> {
    if (!this.session || preference !== this.preference) {
      await this.init(preference);
    }
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: command,
      timestamp: new Date(),
    };
    memoryService.addMessage(userMsg);

    const prompt = `You are the PhillOS Agent. Interpret the user's request and respond ONLY with a JSON object describing the action to take. Example format: {"action": "open_app", "parameters": {"app": "files"}}. If the request is a search query, use action 'search' with a 'query' parameter. Request: ${command}`;
    const stream = sendModelMessageStream(this.session!, prompt);
    let response = '';
    for await (const chunk of stream) {
      response += chunk;
    }
    memoryService.addMessage({
      id: Date.now().toString() + '-model',
      role: 'model',
      text: response,
      timestamp: new Date(),
    });
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
