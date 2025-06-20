class PulseMonitorService {
  async getStatus() {
    try {
      const res = await fetch('/api/pulsemonitor/status');
      if (!res.ok) return { bpm: 0 };
      return await res.json();
    } catch {
      return { bpm: 0 };
    }
  }
}

export const pulseMonitorService = new PulseMonitorService();
