const TRACKERS = [
  'google-analytics.com',
  'doubleclick.net',
  'facebook.com/tr',
  'adservice.google.com',
];

export function scanUrl(url: string): string[] {
  return TRACKERS.filter(t => url.includes(t));
}

import { agentOrchestrator } from './agentOrchestrator';

agentOrchestrator.registerAction('privacy.scan_url', params => scanUrl(String(params?.url || '')));
