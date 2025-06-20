class AppForgeService {
  async listTags(repo: string): Promise<string[]> {
    const res = await fetch(`/appforge/repos?repo=${encodeURIComponent(repo)}`);
    if (!res.ok) throw new Error('Failed to list tags');
    const data = await res.json();
    return data.tags || [];
  }

  async install(image: string): Promise<void> {
    const res = await fetch('/appforge/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) throw new Error('Install failed');
  }

  async uninstall(image: string): Promise<void> {
    const res = await fetch('/appforge/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) throw new Error('Uninstall failed');
  }

  async usage(): Promise<Record<string, number>> {
    const res = await fetch('/appforge/usage');
    if (!res.ok) return {};
    return res.json();
  }
}

export const appForgeService = new AppForgeService();
export default appForgeService;
