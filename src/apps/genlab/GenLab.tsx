import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AppPanel } from '../../components/layout/AppPanel';
import { BrainPadTray } from '../../components/BrainPadTray';
import { brainPadService } from '../../services/brainPadService';
import { GlassCard } from '../../components/GlassCard';
import { promptCoachService } from '../../services/promptCoachService';

export const GenLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [outA, setOutA] = useState('');
  const [outB, setOutB] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const text = prompt.trim();
      if (!text) {
        setTips([]);
        return;
      }
      const t = await promptCoachService.getTips(text);
      if (!cancelled) setTips(t);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [prompt]);

  const run = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/genlab/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setOutA(data.a || '');
        setOutB(data.b || '');
      } else {
        setOutA('Error running models');
        setOutB('');
      }
    } catch (err: any) {
      setOutA('Error: ' + err.message);
      setOutB('');
    }
    setRunning(false);
  };

  return (
    <AppPanel className="!p-0">
      <div className="grid grid-cols-2 gap-4 h-full">
        <GlassCard className="flex flex-col">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          theme="vs-dark"
          value={prompt}
          onChange={(v) => setPrompt(v || '')}
        />
        {tips.length > 0 && (
          <ul className="mt-2 text-xs list-disc pl-4 space-y-1">
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded self-start"
          onClick={run}
          disabled={running}
        >
          {running ? 'Running...' : 'Run'}
        </button>
      </GlassCard>
      <div className="flex flex-col gap-4">
        <GlassCard className="flex-grow overflow-auto flex flex-col">
          <div className="mb-2 font-bold border-b border-white/10">Model A</div>
          <pre className="whitespace-pre-wrap text-sm flex-grow">{outA}</pre>
          <button
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded self-start text-xs"
            disabled={!outA}
            onClick={() => brainPadService.postSnippet(outA)}
          >
            Send to BrainPad
          </button>
        </GlassCard>
        <GlassCard className="flex-grow overflow-auto flex flex-col">
          <div className="mb-2 font-bold border-b border-white/10">Model B</div>
          <pre className="whitespace-pre-wrap text-sm flex-grow">{outB}</pre>
          <button
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded self-start text-xs"
            disabled={!outB}
            onClick={() => brainPadService.postSnippet(outB)}
          >
            Send to BrainPad
          </button>
        </GlassCard>
        <BrainPadTray />
      </div>
      </div>
    </AppPanel>
  );
};

export default GenLab;
