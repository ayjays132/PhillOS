import React, { useState, useEffect } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { weblensResearchService, FactCheckResult } from '../../services/weblensResearchService';
import { scanUrl } from '../../services/privacyGuard';
import { researchMate } from '../../services/researchMate';

interface ArticleMeta {
  title: string;
  author: string;
  published: string;
}

interface Citation {
  text: string;
  url: string;
  verified: boolean;
}

export const WebLens: React.FC = () => {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState<FactCheckResult[]>([]);
  const [meta, setMeta] = useState<ArticleMeta | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [trackers, setTrackers] = useState<string[]>([]);

  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      const found = scanUrl(url.toString());
      if (found.length) {
        setTrackers(prev => Array.from(new Set([...prev, ...found])));
      }
      return orig(input as any, init);
    };
    return () => {
      window.fetch = orig;
    };
  }, []);

  const fetchSummary = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weblens/summarize?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setSummary(data.summary);
      setMeta(data.meta || null);
      const ver = await researchMate.verifyCitations(data.citations || []);
      setCitations(
        (data.citations || []).map((c: any, i: number) => ({
          text: c.text,
          url: c.url,
          verified: ver[i],
        })),
      );

      try {
        const pageRes = await fetch(url);
        const pageText = await pageRes.text();
        const checks = await weblensResearchService.factCheck(pageText);
        setFacts(checks);
      } catch {
        setFacts([]);
      }
    } catch {
      setSummary('Error fetching summary');
      setFacts([]);
      setMeta(null);
      setCitations([]);
    }
    setLoading(false);
  };

    return (
      <AppPanel>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-grow text-sm rounded border border-white/20 bg-transparent px-2 py-1"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter URL"
          />
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>
        {meta && (
          <div className="text-xs mb-2 space-y-1">
            <div>
              <b>Title:</b> {meta.title}
            </div>
            {meta.author && (
              <div>
                <b>Author:</b> {meta.author}
              </div>
            )}
            {meta.published && (
              <div>
                <b>Published:</b> {meta.published}
              </div>
            )}
          </div>
        )}
        {trackers.length > 0 && (
          <div className="text-xs text-red-400 mb-2">
            Trackers detected: {trackers.join(', ')}
          </div>
        )}
        <pre className="flex-grow overflow-auto text-sm whitespace-pre-wrap">{summary}</pre>
        {citations.length > 0 && (
          <ul className="mt-2 text-xs space-y-1">
            {citations.map((c, i) => (
              <li key={i} className="border-b border-white/10 pb-1 flex justify-between">
                <span>{c.text}</span>
                <span className={c.verified ? 'text-green-400' : 'text-red-400'}>
                  {c.verified ? 'verified' : 'unverified'}
                </span>
              </li>
            ))}
          </ul>
        )}
        {facts.length > 0 && (
          <ul className="mt-2 text-sm space-y-1">
            {facts.map((f, i) => (
              <li key={i} className="border-b border-white/10 pb-1">
                <div>{f.text}</div>
                <div className="text-xs text-gray-400">
                  {f.source} – {(f.confidence * 100).toFixed(0)}%
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppPanel>
    );
};

export default WebLens;
