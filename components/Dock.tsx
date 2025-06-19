
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';

interface DockProps {
  navItems: NavItem[];
}

export const Dock: React.FC<DockProps> = ({ navItems }) => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 glass-card-style bg-white/10 rounded-full shadow-2xl shadow-purple-700/50">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              `p-3 rounded-full transition-all duration-200 ease-out hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 ${
                isActive ? 'bg-purple-500/50 scale-110' : 'bg-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <item.icon size={24} className={isActive ? 'text-white' : 'text-white/80'} />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
