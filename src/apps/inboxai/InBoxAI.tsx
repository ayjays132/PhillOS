import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';

interface Message { id: number; from: string; subject: string; body: string; }

export const InBoxAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    fetch('/api/inboxai/messages')
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => setMessages([]));
  }, []);

  const summarize = async () => {
    if (!selected) return;
    setSummary('');
    try {
      const res = await fetch('/api/inboxai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary('Error generating summary');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <GlassCard className="overflow-auto">
        <ul>
          {messages.map(m => (
            <li key={m.id}>
              <button className="text-left hover:underline" onClick={() => { setSelected(m); setSummary(''); }}>
                {m.subject}
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard className="flex flex-col">
        {selected && (
          <>
            <div className="mb-2 font-bold border-b border-white/10 pb-1">{selected.subject}</div>
            <pre className="flex-grow overflow-auto text-sm whitespace-pre-wrap">{selected.body}</pre>
            {summary && <div className="mt-2 text-sm text-purple-300">{summary}</div>}
            <button className="mt-2 px-3 py-1 bg-blue-500 text-white rounded self-start" onClick={summarize}>
              AI Summarize
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
};

export default InBoxAI;
