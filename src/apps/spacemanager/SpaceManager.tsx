import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { workspaceSnapService, WindowLayout } from '../../services/workspaceSnapService';
import { gestureService } from '../../services/gestureService';
import useAutoGroup from '../../hooks/useAutoGroup';

export const SpaceManager: React.FC = () => {
  const [windows, setWindows] = useState<WindowLayout[]>([]);
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [activeGroup, setActiveGroup] = useState(0);
  const groups = useAutoGroup(windows, 2);
  const [gestures, setGestures] = useState(false);

  useEffect(() => {
    workspaceSnapService.loadSnapshot('default').then(snap => {
      if (snap) setWindows(snap);
      const ids = workspaceSnapService.getGroups('default');
      setGroupIds(ids);
      if (ids.length) setActiveGroup(ids[0]);
    });
  }, []);

  useEffect(() => {
    if (gestures && groupIds.length) {
      gestureService.init(groupIds.map(g => g.toString()));
      return gestureService.onSwitch(id => {
        const group = Number(id);
        const snap = workspaceSnapService.switchGroup('default', group);
        if (snap) setWindows(snap);
        setActiveGroup(group);
      });
    }
  }, [gestures, groupIds]);

  const saveSnap = () => workspaceSnapService.save('default', windows);
  const loadSnap = () => {
    workspaceSnapService.loadSnapshot('default').then(snap => {
      if (snap) setWindows(snap);
    });
  };

  return (
    <AppPanel className="items-center justify-center space-y-2">
        <h1 className="text-3xl font-bold mb-2">SpaceManager</h1>
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveSnap}>Snapshot</button>
          <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={loadSnap}>Restore</button>
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => setGestures(true)} disabled={gestures}>Enable Gestures</button>
        </div>
        <p className="text-xs text-white/70">Active Group: {activeGroup}</p>
        <ul className="text-xs list-disc list-inside">
          {windows.map(w => (
            <li key={w.id}>{w.id} (g{w.group ?? 0})</li>
          ))}
        </ul>
    </AppPanel>
  );
};

export default SpaceManager;
