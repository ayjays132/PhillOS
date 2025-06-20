import React, { useEffect, useState, useRef } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { brainPadService, BrainPadEntry } from '../../services/brainPadService';
import { createSummaryWorker, SummaryWorker } from '../../services/modelManager';

export const BrainPad: React.FC = () => {
  const [entries, setEntries] = useState<BrainPadEntry[]>([]);
  const [text, setText] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const workerRef = useRef<SummaryWorker | null>(null);

  useEffect(() => {
    brainPadService.init();
    setEntries(brainPadService.getEntries());
    workerRef.current = createSummaryWorker(setBullets, 300);
    return () => workerRef.current?.stop();
  }, []);

  useEffect(() => {
    workerRef.current?.update(text);
  }, [text]);

  const add = () => {
    if (!text.trim()) return;
    brainPadService.addEntry(text.trim());
    setEntries(brainPadService.getEntries());
    setText('');
  };

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">BrainPad</h1>
        <div className="flex gap-4 mb-2">
          <textarea className="flex-grow bg-transparent border border-white/20 rounded p-2 text-sm" value={text} onChange={e => setText(e.target.value)} />
          {bullets.length > 0 && (
            <ul className="w-1/3 text-xs list-disc pl-4 space-y-1">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={add} className="self-start px-2 py-1 text-xs bg-blue-500 text-white rounded mb-4">Add</button>
        <ul className="space-y-1 overflow-auto text-sm">
          {entries.map((e, i) => (
            <li key={i}>{new Date(e.timestamp).toLocaleString()} - {e.content}</li>
          ))}
        </ul>
    </AppPanel>
  );
};

export default BrainPad;
