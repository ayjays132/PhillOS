import { agentOrchestrator } from './agentOrchestrator';

interface DiagnosticStatus {
  cpu: number;
  memory: number;
  uptime: number;
}

class DiagnosticService {
  async getStatus(): Promise<DiagnosticStatus> {
    try {
      const res = await fetch('/api/diagnostics');
      if (!res.ok) return { cpu: 0, memory: 0, uptime: 0 };
      return (await res.json()) as DiagnosticStatus;
    } catch {
      return { cpu: 0, memory: 0, uptime: 0 };
    }
  }
}

export const diagnosticService = new DiagnosticService();

agentOrchestrator.registerAction('diagnostics.status', () => diagnosticService.getStatus());
