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

  async runSelfTest(): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/diagnostics/selftest');
      if (!res.ok) return { success: false };
      return (await res.json()) as { success: boolean };
    } catch {
      return { success: false };
    }
  }
}

export const diagnosticService = new DiagnosticService();

agentOrchestrator.registerAction('diagnostics.status', () => diagnosticService.getStatus());
agentOrchestrator.registerAction('diagnostics.selftest', () => diagnosticService.runSelfTest());
