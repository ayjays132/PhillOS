
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';

import { DeviceType } from '../hooks/useDeviceType';

interface DockProps {
  navItems: NavItem[];
  deviceType?: DeviceType;
}

export const Dock: React.FC<DockProps> = ({ navItems, deviceType = 'desktop' }) => {
  const isVertical = deviceType === 'vr' || deviceType === 'steamdeck';
  const iconSize = isVertical ? 32 : 24;
  const containerPadding = isVertical ? 'p-3' : 'p-2';
  return (
    <nav className={`fixed z-50 ${isVertical ? 'left-4 top-1/2 -translate-y-1/2' : 'bottom-4 left-1/2 -translate-x-1/2'}`}> 
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-2 ${containerPadding} glass-card-style bg-white/10 rounded-full shadow-2xl shadow-purple-700/50`}>
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
              <item.icon size={iconSize} className={isActive ? 'text-white' : 'text-white/80'} />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
