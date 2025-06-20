class SpaceManagerService {
  async getUsage() {
    try {
      const res = await fetch('/api/spacemanager/usage');
      if (!res.ok) return { used: 0, total: 0 };
      return await res.json();
    } catch {
      return { used: 0, total: 0 };
    }
  }
}

export const spaceManagerService = new SpaceManagerService();
