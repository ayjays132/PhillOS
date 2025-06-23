import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { storageService } from '../../../services/storageService';
import { FileDown, FileUp, Settings2 } from 'lucide-react';
import { SettingChange } from '../../types';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const treeData: TreeNode[] = [
  {
    id: 'system',
    label: 'System',
    children: [
      { id: 'power', label: 'Power Options' },
      { id: 'diagnostics', label: 'Hardware Diagnostics' },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    children: [
      { id: 'logging', label: 'Logging' },
      { id: 'emulator', label: 'Emulator Options' },
    ],
  },
];

export const ControlPanel: React.FC = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [devMode, setDevMode] = useState(
    localStorage.getItem('phillos_dev_mode') === 'true'
  );
  const [telemetry, setTelemetry] = useState(
    localStorage.getItem('phillos_telemetry') !== 'false'
  );
  const [history, setHistory] = useState<SettingChange[]>([]);

  useEffect(() => {
    setHistory(storageService.getSettingsHistory());
  }, []);

  const toggleNode = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const recordChange = (path: string, oldVal: unknown, newVal: unknown) => {
    storageService.addSettingChange({ path, oldValue: oldVal, newValue: newVal, timestamp: Date.now() });
    setHistory(storageService.getSettingsHistory());
  };

  const toggleDevMode = (v: boolean) => {
    localStorage.setItem('phillos_dev_mode', String(v));
    recordChange('developer.devMode', devMode, v);
    setDevMode(v);
  };

  const toggleTelemetry = (v: boolean) => {
    localStorage.setItem('phillos_telemetry', String(v));
    recordChange('system.telemetry', telemetry, v);
    setTelemetry(v);
  };

  const exportSettings = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('phillos')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phillos-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const obj = JSON.parse((e.target?.result as string) || '{}');
        Object.keys(obj).forEach(k => {
          localStorage.setItem(k, obj[k]);
        });
        recordChange('import', null, obj);
        setDevMode(localStorage.getItem('phillos_dev_mode') === 'true');
        setTelemetry(localStorage.getItem('phillos_telemetry') !== 'false');
      } catch {
        // ignore
      }
    };
    reader.readAsText(file);
  };

  const renderTree = (nodes: TreeNode[], level = 0) => (
    <ul className={level ? `ml-${level * 4}` : undefined}>
      {nodes.map(n => (
        <li key={n.id} className="my-1">
          <div className="flex items-center gap-1">
            {n.children && (
              <button onClick={() => toggleNode(n.id)} className="text-xs w-4">
                {expanded[n.id] ? '-' : '+'}
              </button>
            )}
            <span>{n.label}</span>
          </div>
          {n.children && expanded[n.id] && renderTree(n.children, level + 1)}
        </li>
      ))}
    </ul>
  );

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 flex flex-col gap-4 h-full p-2 sm:p-4">
      <div className="flex items-center mb-2">
        <Settings2 size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Control Panel</h1>
      </div>
      <div className="flex-1 overflow-auto text-sm space-y-2">
        {renderTree(treeData)}
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={devMode} onChange={e => toggleDevMode(e.target.checked)} />
          <span>Developer Mode</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={telemetry} onChange={e => toggleTelemetry(e.target.checked)} />
          <span>Enable telemetry</span>
        </label>
      </div>
      <div className="flex gap-2 text-sm">
        <button onClick={exportSettings} className="flex items-center gap-1 bg-cyan-700/60 hover:bg-cyan-600/60 px-2 py-1 rounded">
          <FileDown size={16} /> Export
        </button>
        <label className="flex items-center gap-1 bg-cyan-700/60 hover:bg-cyan-600/60 px-2 py-1 rounded cursor-pointer">
          <FileUp size={16} /> Import
          <input type="file" accept="application/json" onChange={e => e.target.files && importSettings(e.target.files[0])} className="hidden" />
        </label>
      </div>
      <div className="mt-4">
        <h2 className="font-semibold mb-1">History</h2>
        <ul className="text-xs space-y-1 max-h-32 overflow-auto">
          {history.map((h, i) => (
            <li key={i}>{new Date(h.timestamp).toLocaleString()} - {h.path}</li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
};

export default ControlPanel;
