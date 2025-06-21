import { useEffect, useState } from 'react';

export interface WindowMeta {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tags?: string[];
}

function distance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function kmeans(points: number[][], k: number, maxIter = 20) {
  if (points.length === 0) return [];
  const dims = points[0].length;
  const centroids = points.slice(0, k).map(p => p.slice());
  const assignment = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    // assign
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestDist = distance(points[i], centroids[0]);
      for (let c = 1; c < k; c++) {
        const d = distance(points[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best;
        changed = true;
      }
    }

    // update
    const sums = Array.from({ length: k }, () => new Array(dims).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < points.length; i++) {
      const cluster = assignment[i];
      counts[cluster]++;
      for (let d = 0; d < dims; d++) sums[cluster][d] += points[i][d];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let d = 0; d < dims; d++) centroids[c][d] = sums[c][d] / counts[c];
    }

    if (!changed) break;
  }

  return assignment;
}

export function useAutoGroup(windows: WindowMeta[], k = 2) {
  const [groups, setGroups] = useState<WindowMeta[][]>([]);

  useEffect(() => {
    if (windows.length === 0) {
      setGroups([]);
      return;
    }
    if (k <= 1) {
      setGroups([windows]);
      return;
    }

    const points = windows.map(w => [w.x, w.y, w.width, w.height]);
    const assignments = kmeans(points, Math.min(k, windows.length));
    const result: WindowMeta[][] = Array.from({ length: Math.min(k, windows.length) }, () => []);
    assignments.forEach((c, idx) => {
      result[c].push(windows[idx]);
    });
    setGroups(result);
  }, [windows, k]);

  return groups;
}

export default useAutoGroup;
