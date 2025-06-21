import React from 'react';
import { GlassCard } from '../GlassCard';
import { useCursor } from '../../contexts/CursorContext';
import { MousePointer } from 'lucide-react';
import defaultCursor from '../../assets/cursors/arrow_light.svg?url';

export const CursorSettingsView: React.FC = () => {
  const { style, setStyle, animated, setAnimated } = useCursor();

  const previewUrl = style === 'svg' ? defaultCursor : 'auto';

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <MousePointer size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Cursor Settings</h1>
      </div>
      <label className="text-sm flex flex-col gap-1">
        <span>Select Theme</span>
        <select
          value={style}
          onChange={e => setStyle(e.target.value as any)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        >
          <option value="default">Default</option>
          <option value="svg">SVG</option>
        </select>
      </label>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm">Preview:</span>
        <div
          className="w-6 h-6 border border-white/20"
          style={{ cursor: style === 'svg' ? `url(${previewUrl}) 0 0, auto` : 'auto' }}
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={animated}
          onChange={e => setAnimated(e.target.checked)}
        />
        <span>Animate cursor</span>
      </label>
    </GlassCard>
  );
};

export default CursorSettingsView;
