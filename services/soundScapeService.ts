class SoundScapeService {
  async getTracks() {
    try {
      const res = await fetch('/api/soundscape/tracks');
      if (!res.ok) return [];
      const data = await res.json();
      return data.tracks || [];
    } catch {
      return [];
    }
  }
}

export const soundScapeService = new SoundScapeService();
