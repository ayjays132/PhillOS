import { agentOrchestrator } from './agentOrchestrator';

class SecureCoreService {
  async getStatus() {
    try {
      const res = await fetch('/api/securecore/status');
      if (!res.ok) return { firewall: false };
      return await res.json();
    } catch {
      return { firewall: false };
    }
  }

  async toggleFirewall() {
    try {
      const res = await fetch('/api/securecore/toggle', { method: 'POST' });
      if (!res.ok) return { firewall: false };
      return await res.json();
    } catch {
      return { firewall: false };
    }
  }
  async scan() {
    try {
      const res = await fetch('/api/securecore/scan', { method: 'POST' });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  }

  async getThreatScore() {
    try {
      const res = await fetch('/api/securecore/threat');
      if (!res.ok) return { score: 0 };
      return await res.json();
    } catch {
      return { score: 0 };
    }
  }
}

export const secureCoreService = new SecureCoreService();

agentOrchestrator.registerAction('secure.get_status', () => secureCoreService.getStatus());
agentOrchestrator.registerAction('secure.toggle_firewall', () => secureCoreService.toggleFirewall());
agentOrchestrator.registerAction('secure.scan', () => secureCoreService.scan());
agentOrchestrator.registerAction('secure.get_threat', () => secureCoreService.getThreatScore());
