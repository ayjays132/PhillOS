import { createCloudChatSession, sendMessageStream, CloudProvider } from './cloudAIService';
import { agentOrchestrator } from './agentOrchestrator';

class PromptCoachService {
  async getTips(prompt: string, apiKey: string = '', provider: CloudProvider = 'gemini'): Promise<string[]> {
    try {
      const session = await createCloudChatSession(provider, apiKey);
      if (!session) return [];
      let text = '';
      for await (const chunk of sendMessageStream(session, `Provide concise bullet-point tips to improve this prompt:\n${prompt}`)) {
        text += chunk;
      }
      return text
        .split(/\n+/)
        .map(l => l.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }
}

export const promptCoachService = new PromptCoachService();

agentOrchestrator.registerAction('genlab.prompt_coach', params =>
  promptCoachService.getTips(
    String(params?.prompt || ''),
    String(params?.apiKey || ''),
    (params?.provider as CloudProvider) || 'gemini'
  )
);
