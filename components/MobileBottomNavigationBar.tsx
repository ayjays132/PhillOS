
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';
import { DeviceType } from '../hooks/useDeviceType';

interface MobileBottomNavigationBarProps {
  navItems: NavItem[];
  deviceType?: DeviceType;
}

export const MobileBottomNavigationBar: React.FC<MobileBottomNavigationBarProps> = ({ navItems, deviceType = 'mobile' }) => {
  const iconSize = deviceType === 'vr' || deviceType === 'steamdeck' ? 28 : 22;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card-style bg-white/15 !rounded-none !rounded-t-2xl shadow-2xl shadow-purple-700/50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-out hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 w-1/5 ${ // Max 5 items for typical mobile nav
                isActive ? 'text-cyan-300 opacity-100' : 'text-white/70 opacity-80 hover:opacity-100'
              }`
            }
          >
            <item.icon size={iconSize} />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
