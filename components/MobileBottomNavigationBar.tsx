
import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';
import { DeviceType } from '../hooks/useDeviceType';

interface MobileBottomNavigationBarProps {
  navItems: NavItem[];
  deviceType?: DeviceType;
  hasGamepad?: boolean;
}

export const MobileBottomNavigationBar: React.FC<MobileBottomNavigationBarProps> = ({ navItems, deviceType = 'mobile', hasGamepad = false }) => {
  const iconSize = deviceType === 'vr' || deviceType === 'steamdeck' || hasGamepad ? 32 : 22;
  const itemPadding = hasGamepad ? 'p-4' : 'p-2';
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const register = (el: HTMLAnchorElement | null, idx: number) => {
    linkRefs.current[idx] = el;
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = linkRefs.current.indexOf(document.activeElement as HTMLAnchorElement);
    if (current === -1) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = (current + 1) % linkRefs.current.length;
      linkRefs.current[next]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = (current - 1 + linkRefs.current.length) % linkRefs.current.length;
      linkRefs.current[prev]?.focus();
      e.preventDefault();
    }
  };
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card-style bg-white/15 !rounded-none !rounded-t-2xl shadow-2xl shadow-purple-700/50"
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item, index) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center ${itemPadding} rounded-lg transition-all duration-200 ease-out hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 flex-1 ${
                  isActive ? 'text-cyan-300 opacity-100' : 'text-white/70 opacity-80 hover:opacity-100'
                }`
            }
            tabIndex={0}
            ref={(el) => register(el, index)}
          >
            <item.icon size={iconSize} />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
