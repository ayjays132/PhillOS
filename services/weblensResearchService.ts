import { summarize } from './modelManager';
import { agentOrchestrator } from './agentOrchestrator';

export interface FactCheckResult {
  text: string;
  source: string;
  confidence: number;
}

class WeblensResearchService {
  async factCheck(text: string): Promise<FactCheckResult[]> {
    try {
      const summary = await summarize(text);
      const sentences = summary
        .split(/\n+/)
        .flatMap(line => line.split(/[.]/))
        .map(s => s.trim())
        .filter(Boolean);
      return sentences.map((s, i) => ({
        text: s,
        source: `source${i + 1}`,
        confidence: 0.5,
      }));
    } catch {
      return [];
    }
  }
}

export const weblensResearchService = new WeblensResearchService();

agentOrchestrator.registerAction('weblens.fact_check', params =>
  weblensResearchService.factCheck(String(params?.text || ''))
);
