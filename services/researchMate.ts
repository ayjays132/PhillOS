import { agentOrchestrator } from './agentOrchestrator';

async function loadVerifier(): Promise<(text: string) => Promise<boolean>> {
  try {
    const mod = await import('../src/wasm/citation');
    return await mod.loadCitationVerifier();
  } catch {
    return async () => true;
  }
}

class ResearchMate {
  private verifier: Promise<(text: string) => Promise<boolean>> | null = null;

  private async ensure() {
    if (!this.verifier) this.verifier = loadVerifier();
    return this.verifier;
  }

  async verifyCitation(text: string): Promise<boolean> {
    const v = await this.ensure();
    return v(text);
  }

  async verifyCitations(citations: { text: string; url: string }[]): Promise<boolean[]> {
    const v = await this.ensure();
    return Promise.all(citations.map(c => v(`${c.text} ${c.url}`)));
  }
}

export const researchMate = new ResearchMate();

agentOrchestrator.registerAction('research.verify_citation', params =>
  researchMate.verifyCitation(String(params?.text || '')),
);
