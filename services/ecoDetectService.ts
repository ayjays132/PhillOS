import { agentOrchestrator } from './agentOrchestrator';

export interface EcoProcess {
  pid: number;
  cpu: number;
  mem: number;
  cmd: string;
}

class EcoDetectService {
  async detect(): Promise<EcoProcess[]> {
    try {
      const res = await fetch('/api/eco/detect');
      if (!res.ok) return [];
      const data = await res.json();
      return data.list || [];
    } catch {
      return [];
    }
  }

  async kill(pid: number): Promise<boolean> {
    try {
      const res = await fetch('/api/eco/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const ecoDetectService = new EcoDetectService();

agentOrchestrator.registerAction('ecoDetect', params => {
  if (params?.pid) return ecoDetectService.kill(Number(params.pid));
  return ecoDetectService.detect();
});
