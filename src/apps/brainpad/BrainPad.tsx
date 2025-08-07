import React, { useEffect, useState, useRef } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { brainPadService, BrainPadEntry } from '../../../services/brainPadService';
import { createSummaryWorker, SummaryWorker } from '../../../services/modelManager';
import { VoiceService } from '../../../services/voiceService';
import { noteLinkService } from '../../../services/noteLinkService';
import { CalendarEvent } from '../../types';

export const BrainPad: React.FC = () => {
  const [entries, setEntries] = useState<BrainPadEntry[]>([]);
  const [text, setText] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<number, CalendarEvent[]>>({});
  const [apiKey, setApiKey] = useState('');
  const [listening, setListening] = useState(false);
  const workerRef = useRef<SummaryWorker | null>(null);
  const voiceRef = useRef<VoiceService | null>(null);

  useEffect(() => {
    brainPadService.init();
    setEntries(brainPadService.getEntries());
    workerRef.current = createSummaryWorker(setBullets, 300);
    voiceRef.current = new VoiceService('auto');
    noteLinkService.linkNotes(brainPadService.getEntries()).then(setLinks);
    return () => workerRef.current?.stop();
  }, []);

  useEffect(() => {
    workerRef.current?.update(text);
  }, [text]);

  useEffect(() => {
    noteLinkService.linkNotes(entries).then(setLinks);
  }, [entries]);

  const add = async () => {
    if (!text.trim()) return;
    brainPadService.addEntry(text.trim());
    const updated = brainPadService.getEntries();
    setEntries(updated);
    setLinks(await noteLinkService.linkNotes(updated));
    setText('');
  };

  const toggleVoice = () => {
    if (listening) {
      voiceRef.current?.stop();
      setListening(false);
    } else {
      setListening(true);
      voiceRef.current?.start(async (t, final) => {
        if (final && t.trim()) {
          const summary = apiKey ? await brainPadService.summarize(t, apiKey) : [];
          const content = summary.length ? summary.map(b => `• ${b}`).join('\n') : t;
          brainPadService.addEntry(content);
          const updated = brainPadService.getEntries();
          setEntries(updated);
          setLinks(await noteLinkService.linkNotes(updated));
        }
      });
    }
  };

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">BrainPad</h1>
        <div className="flex gap-4 mb-2 items-start">
          <textarea
            className="flex-grow bg-transparent border border-white/20 rounded p-2 text-sm"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          {bullets.length > 0 && (
            <ul className="w-1/3 text-xs list-disc pl-4 space-y-1">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="password"
            placeholder="Cloud AI API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="flex-grow bg-transparent border border-white/20 rounded p-1 text-xs"
          />
          <button onClick={toggleVoice} className="px-2 py-1 text-xs rounded bg-purple-500 text-white">
            {listening ? 'Stop' : 'Record'}
          </button>
          <button onClick={add} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">
            Add
          </button>
        </div>
        <ul className="space-y-1 overflow-auto text-sm">
          {entries.map((e, i) => (
            <li key={i}>
              {new Date(e.timestamp).toLocaleString()} - {e.content}
              {links[e.timestamp] && (
                <span className="ml-2 text-xs text-cyan-400">
                  {links[e.timestamp].map(ev => (
                    <a key={ev.id} href="/timeai" className="underline mr-1">
                      {ev.title}
                    </a>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
    </AppPanel>
  );
};

export default BrainPad;
