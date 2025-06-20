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
}

export const secureCoreService = new SecureCoreService();
