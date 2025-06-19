import React, { useState, useEffect } from 'react';

export const TrainingPipelineWidget: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/training/status');
      if (res.ok) {
        const data = await res.json();
        setRunning(!!data.running);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const start = async () => {
    setLoading(true);
    try {
      await fetch('/training/start', { method: 'POST' });
      setRunning(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    setLoading(true);
    try {
      await fetch('/training/stop', { method: 'POST' });
      setRunning(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={running ? stop : start}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 p-2 text-sm rounded-md transition-colors ${running ? 'bg-red-600/70 hover:bg-red-500/70' : 'bg-green-600/70 hover:bg-green-500/70'}`}
      >
        {running ? 'Stop Training' : 'Start Training'}
      </button>
    </div>
  );
};
