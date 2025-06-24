import fs from 'fs/promises';
import path from 'path';
import { agentOrchestrator } from './agentOrchestrator';

const KB_FILE = path.resolve('backend/citationKB.json');

async function loadKB(): Promise<Record<string, boolean>> {
  try {
    const data = await fs.readFile(KB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

class ResearchMate {
  private kb: Promise<Record<string, boolean>> | null = null;

  private async getKB() {
    if (!this.kb) this.kb = loadKB();
    return this.kb;
  }

  async verifyCitation(c: { text: string; url: string }): Promise<boolean> {
    const kb = await this.getKB();
    return !!kb[c.url];
  }

  async verifyCitations(cs: { text: string; url: string }[]): Promise<boolean[]> {
    const kb = await this.getKB();
    return cs.map(c => !!kb[c.url]);
  }
}

export const researchMate = new ResearchMate();

agentOrchestrator.registerAction('research.verify_citation', params =>
  researchMate.verifyCitation({ text: String(params?.text || ''), url: String(params?.url || '') }),
);
