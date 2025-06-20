class MediaSphereService {
  async getMedia() {
    try {
      const res = await fetch('/api/mediasphere/media');
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  }
}

export const mediaSphereService = new MediaSphereService();
