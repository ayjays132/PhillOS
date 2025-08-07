import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { GlassCard } from '../../components/GlassCard';
import { inboxAIService, ScoredInboxMessage } from '../../../services/inboxAIService';
import { inboxPriorityService } from '../../../services/inboxPriorityService';

export const InBoxAI: React.FC = () => {
  const [messages, setMessages] = useState<ScoredInboxMessage[]>([]);
  const [selected, setSelected] = useState<ScoredInboxMessage | null>(null);
  const [summary, setSummary] = useState('');
  const [liveSummary, setLiveSummary] = useState(false);

  useEffect(() => {
    (async () => {
      await inboxPriorityService.scoreInbox();
      const list = await inboxPriorityService.getPriorityList();
      setMessages(list);
    })();
  }, []);

  useEffect(() => {
    if (liveSummary && selected) {
      inboxAIService
        .summarizeMessage(selected.id)
        .then(s => setSummary(s));
    }
  }, [selected, liveSummary]);

  const summarize = async () => {
    if (!selected) return;
    setSummary('');
    try {
      const s = await inboxAIService.summarizeMessage(selected.id);
      setSummary(s || 'Error generating summary');
    } catch {
      setSummary('Error generating summary');
    }
  };

  const chainShrink = async (msg: ScoredInboxMessage) => {
    setSelected(msg);
    setSummary('');
    try {
      const s = await inboxAIService.chainShrink(msg.id);
      setSummary(s || 'Error generating summary');
    } catch {
      setSummary('Error generating summary');
    }
  };

  const importMeeting = async (msg: ScoredInboxMessage) => {
    const ev = await inboxAIService.extractMeeting(msg.id);
    if (ev) {
      alert('Meeting saved to calendar');
    } else {
      alert('No meeting invite found');
    }
  };

  return (
    <AppPanel className="!p-0">
      <div className="grid grid-cols-2 gap-4 h-full">
      <GlassCard className="overflow-auto">
        <ul>
          {messages.map(m => {
            const badge = m.score > 0.7
              ? { text: 'High', color: 'bg-red-600/80' }
              : m.score > 0.4
              ? { text: 'Med', color: 'bg-yellow-600/80' }
              : { text: 'Low', color: 'bg-gray-600/50' };
            return (
              <li key={m.id} className="mb-2">
                <button className="text-left hover:underline" onClick={() => { setSelected(m); setSummary(''); }}>
                  {m.subject}
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full text-white ${badge.color}`}>{badge.text}</span>
                </button>
                <div className="text-xs text-gray-400">{m.body.slice(0, 60)}...</div>
                <div className="space-x-2 mt-1">
                  <button className="text-xs text-blue-400" onClick={() => chainShrink(m)}>
                    ChainShrink
                  </button>
                  <button className="text-xs text-green-400" onClick={() => importMeeting(m)}>
                    Import Meeting
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassCard>
      <GlassCard className="flex flex-col">
        {selected && (
          <>
            <div className="mb-2 font-bold border-b border-white/10 pb-1">{selected.subject}</div>
            <pre className="flex-grow overflow-auto text-sm whitespace-pre-wrap">{selected.body}</pre>
            {summary && <div className="mt-2 text-sm text-purple-300">{summary}</div>}
            <label className="mt-2 mb-1 inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={liveSummary} onChange={e => setLiveSummary(e.target.checked)} />
              <span>Live Summary</span>
            </label>
            <button className="px-3 py-1 bg-blue-500 text-white rounded self-start" onClick={summarize}>
              AI Summarize
            </button>
          </>
        )}
      </GlassCard>
      </div>
    </AppPanel>
  );
};

export default InBoxAI;
