import React from "react";
import { GlassCard } from "../GlassCard";
import { useCursor } from "../../contexts/CursorContext";
import { MousePointer } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export const CursorSettingsView: React.FC = () => {
  const { style, setStyle, animated, setAnimated } = useCursor();
  const { theme } = useTheme();

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
          onChange={(e) => setStyle(e.target.value as any)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        >
          <option value="default">Default</option>
          <option value="svg">SVG</option>
        </select>
      </label>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm">Preview:</span>
        {style === "svg" ? (
          <div
            className={`cursor-preview ${animated ? "animated" : "no-animation"}`}
            data-theme={theme}
          >
            <svg viewBox="0 0 24 24">
              <path d="M2 2 L2 18 L7 13 L11 23 L14 22 L9 12 L19 12 Z" />
            </svg>
          </div>
        ) : (
          <div
            className="w-6 h-6 border border-white/20"
            style={{ cursor: "auto" }}
          />
        )}
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={animated}
          onChange={(e) => setAnimated(e.target.checked)}
        />
        <span>Animate cursor</span>
      </label>
    </GlassCard>
  );
};

export default CursorSettingsView;
