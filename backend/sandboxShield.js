export const RISK_THRESHOLD = 70;

export function scoreExecutable(p) {
  if (!p) return 0;
  if (/malware|danger/i.test(p)) return 90;
  return 10;
}
