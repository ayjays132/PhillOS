import React, { useEffect, useState } from 'react';

const decodeDataUrl = (data: any, mime: string): string | null => {
  try {
    let buffer: ArrayBuffer;
    if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (ArrayBuffer.isView(data)) {
      buffer = data.buffer;
    } else if (typeof data === 'string') {
      const bin = atob(data);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      buffer = arr.buffer;
    } else if (Array.isArray(data)) {
      buffer = Uint8Array.from(data).buffer;
    } else {
      return null;
    }
    return URL.createObjectURL(new Blob([buffer], { type: mime }));
  } catch {
    return null;
  }
};

const BootScreen: React.FC = () => {
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  useEffect(() => {
    const win: any = window as any;
    const info = win.bootInfo || win.boot_info;
    if (info?.svgBase) {
      const url = decodeDataUrl(info.svgBase, 'image/svg+xml');
      if (url) {
        setSvgUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else if (info?.spriteBase) {
      const url = decodeDataUrl(info.spriteBase, 'image/svg+xml');
      if (url) {
        setSpriteUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    if (info?.cursorBase) {
      const url = decodeDataUrl(info.cursorBase, 'image/svg+xml');
      if (url) {
        setCursorUrl(url);
        document.documentElement.style.setProperty('--phillos-cursor', `url(${url}) 0 0`);
        return () => {
          URL.revokeObjectURL(url);
          document.documentElement.style.removeProperty('--phillos-cursor');
        };
      }
    }
    return;
  }, []);

  useEffect(() => {
    const win: any = window as any;
    if (typeof win.SVG_BOOT_UPDATE === 'function') {
      let raf: number;
      const update = () => {
        try { win.SVG_BOOT_UPDATE(); } catch {}
        raf = requestAnimationFrame(update);
      };
      update();
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  const win: any = window as any;
  const themeDark = win.bootInfo?.themeDark ?? win.boot_info?.theme_dark ?? 1;

  return (
    <div className={`flex items-center justify-center h-screen bg-gradient-to-br ${themeDark ? 'from-gray-950 via-blue-950 to-purple-950' : 'from-white via-gray-200 to-blue-300'}`}>
      {svgUrl && <img src={svgUrl} alt="Boot animation" className="w-60 h-60" />}
      {!svgUrl && spriteUrl && <img src={spriteUrl} alt="Boot sprite" className="w-60 h-60" />}
      {!svgUrl && !spriteUrl && (
        <div className="w-10 h-10 rounded-full bg-purple-500 animate-pulse" />
      )}
    </div>
  );
};

export default BootScreen;
