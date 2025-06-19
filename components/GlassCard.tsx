
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elementType?: 'div' | 'article' | 'section' | 'aside'; // Allow specifying the root element type
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, elementType = 'div' }) => {
  const baseStyle = "glass-card-style bg-white/5 rounded-2xl p-4 sm:p-5 shadow-xl shadow-purple-900/30";
  const hoverStyle = onClick ? "glass-card-hover cursor-pointer" : "glass-card-hover";
  
  const Element = elementType;

  return (
    <Element 
      className={`${baseStyle} ${hoverStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </Element>
  );
};
