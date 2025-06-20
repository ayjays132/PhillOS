class AppForgeService {
  async build() {
    try {
      const res = await fetch('/api/appforge/build', { method: 'POST' });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  }
}

export const appForgeService = new AppForgeService();
