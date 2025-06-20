class SecureCoreService {
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
