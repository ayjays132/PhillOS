
import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';
import { DeviceType } from '../hooks/useDeviceType';
import { useDock, EXTERNAL_ITEM_TYPE } from '../hooks/useDock';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2 } from 'lucide-react';

interface DockProps {
  deviceType?: DeviceType;
  orientation?: 'portrait' | 'landscape';
  hasGamepad?: boolean;
}

const ITEM_TYPE = 'DOCK_ITEM';

const DockItem: React.FC<{ item: NavItem; index: number; move: (from: number, to: number) => void; iconSize: number; padding: string; register: (el: HTMLAnchorElement | null, idx: number) => void }> = ({ item, index, move, iconSize, padding, register }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [, drop] = useDrop<{ index: number }>({
    accept: ITEM_TYPE,
    hover(dragged) {
      if (dragged.index === index) return;
      move(dragged.index, index);
      dragged.index = index;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  const setRef = (el: HTMLAnchorElement | null) => {
    ref.current = el;
    register(el, index);
  };
  return (
    <NavLink
      ref={setRef}
      to={item.path}
      title={item.label}
      className={({ isActive }) =>
        `${padding} rounded-full transition-all duration-200 ease-out hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 ${
          isActive ? 'bg-purple-500/50 scale-110' : 'bg-transparent'
        } ${isDragging ? 'opacity-50' : ''}`
      }
      tabIndex={0}
    >
      {({ isActive }) => (
        <item.icon size={iconSize} className={isActive ? 'text-white' : 'text-white/80'} />
      )}
    </NavLink>
  );
};

export const Dock: React.FC<DockProps> = ({ deviceType = 'desktop', orientation = 'portrait', hasGamepad = false }) => {
  const { navItems, moveDockItem, addDockItem, removeDockItem } = useDock();
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const register = (el: HTMLAnchorElement | null, idx: number) => {
    linkRefs.current[idx] = el;
  };
  const isVertical = deviceType === 'vr' || deviceType === 'steamdeck' || (hasGamepad && orientation === 'landscape');
  const iconSize = deviceType === 'vr' || hasGamepad ? 40 : isVertical ? 32 : 24;
  const containerPadding = deviceType === 'vr' || hasGamepad ? 'p-4' : isVertical ? 'p-3' : 'p-2';
  const buttonPadding = deviceType === 'vr' || hasGamepad ? 'p-4' : 'p-3';
  const [, drop] = useDrop<{ item: NavItem }>({
    accept: EXTERNAL_ITEM_TYPE,
    drop: (data) => addDockItem(data.item),
  });

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

  const [, removeDrop] = useDrop<{ index: number }>({
    accept: ITEM_TYPE,
    drop: (dragged) => removeDockItem(navItems[dragged.index].id),
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`fixed z-50 ${isVertical ? 'left-4 top-1/2 -translate-y-1/2 flex flex-col items-center' : 'bottom-4 left-1/2 -translate-x-1/2 flex items-center'}`}
      >
        <nav
          ref={drop}
          onKeyDown={handleKeyDown}
        >
          <div
            className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-2 ${containerPadding} glass-card-style bg-white/10 rounded-full shadow-2xl shadow-purple-700/50`}
          >
            {navItems.map((item, index) => (
              <DockItem
                key={item.id}
                item={item}
                index={index}
                move={moveDockItem}
                iconSize={iconSize}
                padding={buttonPadding}
                register={register}
              />
            ))}
          </div>
        </nav>
        <div
          ref={removeDrop}
          className={`${isVertical ? 'mt-2' : 'ml-2'} ${buttonPadding} bg-red-500/30 rounded-full hover:bg-red-500/50`}
        >
          <Trash2 size={Math.round(iconSize * 0.6)} />
        </div>
      </div>
    </DndProvider>
  );
};
