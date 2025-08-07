import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { secureCoreService } from '../../../services/secureCoreService';

export const SecureCore: React.FC = () => {
  const [firewall, setFirewall] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [threat, setThreat] = useState(0);
  const [predict, setPredict] = useState(0);
  const [autoPatch, setAutoPatch] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const THRESHOLD = 70;

  useEffect(() => {
    secureCoreService.getStatus().then(s => setFirewall(s.firewall));
    const load = () => {
      secureCoreService.getThreatScore().then(s => setThreat(s.score));
      secureCoreService.getThreatPrediction().then(s => setPredict(s.score));
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const toggle = async () => {
    const s = await secureCoreService.toggleFirewall();
    setFirewall(s.firewall);
  };

  const scan = async () => {
    const ok = await secureCoreService.scan();
    if (ok) setLastScan(new Date().toLocaleTimeString());
  };

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">SecureCore</h1>
        {threat >= THRESHOLD && (
          <p className="text-sm text-red-400 mb-2">High threat detected! Score {threat}</p>
        )}
        <p className="text-xs text-white/70 mb-2">Predicted risk: {predict}</p>
        <label className="inline-flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" checked={firewall} onChange={toggle} />
          <span>Firewall {firewall ? 'On' : 'Off'}</span>
        </label>
        <label className="inline-flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" checked={autoPatch} onChange={e => setAutoPatch(e.target.checked)} />
          <span>Auto Patch</span>
        </label>
        <label className="flex flex-col gap-1 text-sm mb-4">
          <span>Risk Threshold: {riskThreshold}</span>
          <input type="range" min={10} max={100} value={riskThreshold} onChange={e => setRiskThreshold(Number(e.target.value))} />
        </label>
        <button onClick={scan} className="px-2 py-1 text-xs rounded bg-blue-500 text-white w-max mb-2">Scan</button>
        {lastScan && <p className="text-xs text-white/70">Last scan: {lastScan}</p>}
    </AppPanel>
  );
};

export default SecureCore;
