import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { spaceManagerService } from '../../services/spaceManagerService';
import { workspaceSnapService, WindowLayout } from '../../services/workspaceSnapService';
import { gestureService } from '../../services/gestureService';
import useAutoGroup from '../../hooks/useAutoGroup';

export const SpaceManager: React.FC = () => {
  const [usage, setUsage] = useState({ used: 0, total: 0 });
  const [windows, setWindows] = useState<WindowLayout[]>([]);
  const groups = useAutoGroup(windows, 2);
  const [gestures, setGestures] = useState(false);

  useEffect(() => {
    spaceManagerService.getUsage().then(setUsage);
    const snap = workspaceSnapService.loadSnapshot('default');
    if (snap) setWindows(snap);
  }, []);

  useEffect(() => {
    if (gestures) {
      gestureService.init(workspaceSnapService.list());
      return gestureService.onSwitch(name => {
        const snap = workspaceSnapService.loadSnapshot(name);
        if (snap) setWindows(snap);
      });
    }
  }, [gestures]);

  const pct = usage.total ? Math.round((usage.used / usage.total) * 100) : 0;

  const saveSnap = () => workspaceSnapService.save('default', windows);
  const loadSnap = () => {
    const snap = workspaceSnapService.loadSnapshot('default');
    if (snap) setWindows(snap);
  };

  return (
    <AppPanel className="items-center justify-center space-y-2">
        <h1 className="text-3xl font-bold mb-2">SpaceManager</h1>
        <div className="w-full bg-white/10 rounded h-3 mt-2">
          <div style={{ width: `${pct}%` }} className="h-full bg-blue-500 rounded" />
        </div>
        <p className="text-sm">{usage.used} / {usage.total} GB ({pct}%)</p>
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveSnap}>Snapshot</button>
          <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={loadSnap}>Restore</button>
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => setGestures(true)} disabled={gestures}>Enable Gestures</button>
        </div>
        <p className="text-xs text-white/70">Groups: {groups.length}</p>
    </AppPanel>
  );
};

export default SpaceManager;
