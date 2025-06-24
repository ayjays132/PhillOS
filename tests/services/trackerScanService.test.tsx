import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('trackerScanService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('detects tracker domains in logs', async () => {
    const { trackerScanService } = await import('../../services/trackerScanService');
    const logs = [
      'https://example.com/app.js',
      'https://google-analytics.com/ga.js',
      'https://doubleclick.net/ad.js',
    ];
    const res = trackerScanService.scanRequests(logs);
    expect(res.sort()).toEqual(['doubleclick.net', 'google-analytics.com']);
  });
});
