const TRACKER_DOMAINS = [
  'google-analytics.com',
  'doubleclick.net',
  'facebook.com/tr',
  'adservice.google.com',
];

class TrackerScanService {
  scanRequests(requests: string[]): string[] {
    const hits = new Set<string>();
    for (const req of requests) {
      for (const t of TRACKER_DOMAINS) {
        if (req.includes(t)) hits.add(t);
      }
    }
    return Array.from(hits);
  }
}

export const trackerScanService = new TrackerScanService();

import { agentOrchestrator } from './agentOrchestrator';

agentOrchestrator.registerAction('tracker.scan', params =>
  trackerScanService.scanRequests(Array.isArray(params?.requests) ? params.requests : [])
);
