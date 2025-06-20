import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { WidgetCard } from '../layout/WidgetCard';
import { checkForUpdate, clearCaches } from '../../../services/cacheService';

export const CacheManagementWidget: React.FC = () => (
  <WidgetCard className="space-y-2">
    <button
      onClick={checkForUpdate}
      className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-blue-600/70 hover:bg-blue-500/70 rounded-md transition-colors">
      <RefreshCw size={16} />
      Check for Updates
    </button>
    <button
      onClick={clearCaches}
      className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-red-600/70 hover:bg-red-500/70 rounded-md transition-colors">
      <Trash2 size={16} />
      Clear Cache
    </button>
  </WidgetCard>
);
