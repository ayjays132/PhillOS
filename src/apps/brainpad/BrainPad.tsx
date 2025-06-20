import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { brainPadService, BrainPadEntry } from '../../services/brainPadService';

export const BrainPad: React.FC = () => {
  const [entries, setEntries] = useState<BrainPadEntry[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    brainPadService.init();
    setEntries(brainPadService.getEntries());
  }, []);

  const add = () => {
    if (!text.trim()) return;
    brainPadService.addEntry(text.trim());
    setEntries(brainPadService.getEntries());
    setText('');
  };

  return (
    <div className="p-4 h-full">
      <GlassCard className="h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-4">BrainPad</h1>
        <textarea className="bg-transparent border border-white/20 rounded p-2 mb-2 text-sm" value={text} onChange={e => setText(e.target.value)} />
        <button onClick={add} className="self-start px-2 py-1 text-xs bg-blue-500 text-white rounded mb-4">Add</button>
        <ul className="space-y-1 overflow-auto text-sm">
          {entries.map((e, i) => (
            <li key={i}>{new Date(e.timestamp).toLocaleString()} - {e.content}</li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
};

export default BrainPad;
