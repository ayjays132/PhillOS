import React from 'react';
import { useCloudSyncSetting } from '../../contexts/CloudSyncContext';

export const CloudSyncToggle: React.FC = () => {
  const { enabled, setEnabled } = useCloudSyncSetting();
  return (
    <label className="inline-flex items-center space-x-2 text-sm">
      <input
        type="checkbox"
        checked={enabled}
        onChange={e => setEnabled(e.target.checked)}
      />
      <span>Cloud Sync</span>
    </label>
  );
};
