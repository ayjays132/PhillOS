import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { GlassCard } from '../../components/GlassCard';
import { BrainPadTray } from '../../components/BrainPadTray';

export const GenLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [outA, setOutA] = useState('');
  const [outB, setOutB] = useState('');
  const [running, setRunning] = useState(false);

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
    <div className="grid grid-cols-2 gap-4 h-full">
      <GlassCard className="flex flex-col">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          theme="vs-dark"
          value={prompt}
          onChange={(v) => setPrompt(v || '')}
        />
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded self-start"
          onClick={run}
          disabled={running}
        >
          {running ? 'Running...' : 'Run'}
        </button>
      </GlassCard>
      <div className="flex flex-col gap-4">
        <GlassCard className="flex-grow overflow-auto">
          <div className="mb-2 font-bold border-b border-white/10">Model A</div>
          <pre className="whitespace-pre-wrap text-sm">{outA}</pre>
        </GlassCard>
        <GlassCard className="flex-grow overflow-auto">
          <div className="mb-2 font-bold border-b border-white/10">Model B</div>
          <pre className="whitespace-pre-wrap text-sm">{outB}</pre>
        </GlassCard>
        <BrainPadTray />
      </div>
    </div>
  );
};

export default GenLab;
