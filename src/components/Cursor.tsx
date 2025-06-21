import React, { useEffect, useRef } from 'react';
import { useCursor } from '../contexts/CursorContext';
import defaultCursor from '../assets/cursors/arrow_light.svg?url';
import macCursor from '../assets/cursors/mac.svg?url';

const Cursor: React.FC = () => {
  const { style } = useCursor();
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
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
  }, []);

  const src = style === 'mac' ? macCursor : defaultCursor;

  return (
    <div ref={ref} className="cursor-overlay">
      <img src={src} alt="cursor" />
    </div>
  );
};

export default Cursor;
