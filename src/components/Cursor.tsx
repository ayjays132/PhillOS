import React, { useEffect, useRef } from 'react';
import { useCursor } from '../contexts/CursorContext';
import { useTheme } from '../contexts/ThemeContext';
import lightCursor from '../assets/cursors/arrow_light.svg?url';
import darkCursor from '../assets/cursors/arrow_dark.svg?url';

const Cursor: React.FC = () => {
  const { style, animated } = useCursor();
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (style !== 'svg') {
      document.body.classList.remove('custom-cursor-active');
      return;
    }
    document.body.classList.add('custom-cursor-active');
    const move = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    document.addEventListener('mousemove', move);
    let raf: number;
    const update = () => {
      raf = requestAnimationFrame(update);
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
    };
    update();
    return () => {
      document.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [style]);

  const src = theme === 'dark' ? darkCursor : lightCursor;

  if (style !== 'svg') return null;

  return (
    <div ref={ref} className="cursor-overlay">
      <img src={src} alt="cursor" style={{ animation: animated ? undefined : 'none' }} />
    </div>
  );
};

export default Cursor;
