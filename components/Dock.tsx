
import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../types';
import { DeviceType } from '../hooks/useDeviceType';
import { useDock } from '../hooks/useDock';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DockProps {
  deviceType?: DeviceType;
}

const ITEM_TYPE = 'DOCK_ITEM';
const EXTERNAL_ITEM = 'NEW_DOCK_ITEM';

const DockItem: React.FC<{ item: NavItem; index: number; move: (from: number, to: number) => void; iconSize: number }> = ({ item, index, move, iconSize }) => {
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
  return (
    <NavLink
      ref={ref}
      to={item.path}
      title={item.label}
      className={({ isActive }) =>
        `p-3 rounded-full transition-all duration-200 ease-out hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 ${
          isActive ? 'bg-purple-500/50 scale-110' : 'bg-transparent'
        } ${isDragging ? 'opacity-50' : ''}`
      }
    >
      {({ isActive }) => (
        <item.icon size={iconSize} className={isActive ? 'text-white' : 'text-white/80'} />
      )}
    </NavLink>
  );
};

export const Dock: React.FC<DockProps> = ({ deviceType = 'desktop' }) => {
  const { navItems, moveDockItem, addDockItem } = useDock();
  const isVertical = deviceType === 'vr' || deviceType === 'steamdeck';
  const iconSize = isVertical ? 32 : 24;
  const containerPadding = isVertical ? 'p-3' : 'p-2';
  const [, drop] = useDrop<{ item: NavItem }>({
    accept: EXTERNAL_ITEM,
    drop: (data) => addDockItem(data.item),
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <nav ref={drop} className={`fixed z-50 ${isVertical ? 'left-4 top-1/2 -translate-y-1/2' : 'bottom-4 left-1/2 -translate-x-1/2'}`}>
        <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-2 ${containerPadding} glass-card-style bg-white/10 rounded-full shadow-2xl shadow-purple-700/50`}>
          {navItems.map((item, index) => (
            <DockItem key={item.id} item={item} index={index} move={moveDockItem} iconSize={iconSize} />
          ))}
        </div>
      </nav>
    </DndProvider>
  );
};
