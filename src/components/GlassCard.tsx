
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elementType?: 'div' | 'article' | 'section' | 'aside'; // Allow specifying the root element type
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, elementType = 'div' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const baseStyle = `glass-card-style ${isDark ? 'bg-white/5 shadow-purple-900/30' : 'bg-white/60 shadow-gray-500/30'} rounded-2xl p-4 sm:p-5 shadow-xl`;
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
