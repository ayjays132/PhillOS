import React from 'react';
import { useBrainPad } from '../contexts/BrainPadContext';
import { GlassCard } from './GlassCard';

export const BrainPadTray: React.FC = () => {
  const { entries, addEntry } = useBrainPad();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) addEntry(text);
  };

  return (
    <GlassCard
      className="overflow-auto p-2"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="mb-2 font-bold border-b border-white/10">BrainPad</div>
      {entries.map((e, i) => (
        <pre key={i} className="mb-2 whitespace-pre-wrap text-xs bg-white/5 p-1 rounded">
          {e.content}
        </pre>
      ))}
    </GlassCard>
  );
};
