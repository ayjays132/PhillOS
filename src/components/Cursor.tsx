import React, { useEffect, useRef } from "react";
import { useCursor } from "../contexts/CursorContext";
import { useTheme } from "../contexts/ThemeContext";

const Cursor: React.FC = () => {
  const { style, animated } = useCursor();
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (style !== "svg") {
      document.body.classList.remove("custom-cursor-active");
      return;
    }
    document.body.classList.add("custom-cursor-active");
    const move = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    document.addEventListener("mousemove", move);
    let raf: number;
    const update = () => {
      raf = requestAnimationFrame(update);
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
    };
    update();
    return () => {
      document.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [style]);

  if (style !== "svg") return null;

  const path = "M2 2 L2 18 L7 13 L11 23 L14 22 L9 12 L19 12 Z";

  return (
    <div
      ref={ref}
      className={`cursor-overlay ${animated ? "animated" : "no-animation"}`}
      data-theme={theme}
    >
      <svg viewBox="0 0 24 24" className="cursor-svg">
        <path d={path} />
      </svg>
    </div>
  );
};

export default Cursor;
