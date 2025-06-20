class VisionVaultService {
  async getImages() {
    try {
      const res = await fetch('/api/visionvault/images');
      if (!res.ok) return [];
      const data = await res.json();
      return data.images || [];
    } catch {
      return [];
    }
  }
}

export const visionVaultService = new VisionVaultService();
