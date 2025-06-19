
import React, { useRef } from 'react';
import { GlassCard } from './GlassCard';
import { WidgetConfig, StratumConfig } from '../types';
import { 
  BotMessageSquare, BarChart3, Search, Zap, Gamepad2, UserCircle, Rss, Settings, Palette, BrainCircuit
} from 'lucide-react';
import { AICoPilotWidget } from './widgets/AICoPilotWidget';
import { AIShadowSearchWidget } from './widgets/AIShadowSearchWidget';
import { ContextStreamWidget } from './widgets/ContextStreamWidget';
import { SystemHealthWidget } from './widgets/SystemHealthWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { GamingModeWidget } from './widgets/GamingModeWidget';
import { UserProfileWidget } from './widgets/UserProfileWidget';
import { PersonalizedNewsWidget } from './widgets/PersonalizedNewsWidget';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useWidgetLayout } from '../hooks/useWidgetLayout';

const strataConfig: StratumConfig[] = [
  {
    id: 'stratum-ai-core',
    title: 'AI Core & Search',
    widgets: [
      { id: 'aicopilot', title: 'AI CoPilot', icon: BotMessageSquare, iconColor: 'text-purple-300', component: AICoPilotWidget, colSpanDesktop: 2, rowSpanDesktop: 2, colSpanTablet: 2, rowSpanTablet: 2 },
      { id: 'aishadowsearch', title: 'Shadow Search', icon: Search, iconColor: 'text-cyan-300', component: AIShadowSearchWidget, colSpanDesktop: 1, colSpanTablet: 2 },
      { id: 'contextstream', title: 'Context Stream', icon: BrainCircuit, iconColor: 'text-yellow-300', component: ContextStreamWidget, colSpanDesktop: 1, colSpanTablet: 2 },
    ],
    gridColsDesktop: 2, // widgets within this stratum will use grid-cols-2 on desktop
    gridColsTablet: 1,  // widgets within this stratum will use grid-cols-1 on tablet (effectively stacking them)
  },
  {
    id: 'stratum-system-user',
    title: 'System & User',
    widgets: [
      { id: 'systemhealth', title: 'System Health', icon: BarChart3, iconColor: 'text-green-400', component: SystemHealthWidget, colSpanDesktop: 1, colSpanTablet: 1},
      { id: 'userprofile', title: 'User Profile', icon: UserCircle, iconColor: 'text-orange-300', component: UserProfileWidget, colSpanDesktop: 1, colSpanTablet: 1},
    ],
    gridColsDesktop: 2,
    gridColsTablet: 2,
  },
  {
    id: 'stratum-productivity-entertainment',
    title: 'Productivity & Entertainment',
    widgets: [
      { id: 'quickactions', title: 'Quick Actions', icon: Zap, iconColor: 'text-red-400', component: QuickActionsWidget, colSpanDesktop: 1, colSpanTablet: 2 },
      { id: 'gamingmode', title: 'Gaming Mode', icon: Gamepad2, iconColor: 'text-pink-400', component: GamingModeWidget, colSpanDesktop: 1, colSpanTablet: 1 },
      { id: 'news', title: 'Personalized News', icon: Rss, iconColor: 'text-blue-300', component: PersonalizedNewsWidget, colSpanDesktop: 1, colSpanTablet: 1 },
    ],
    gridColsDesktop: 3, // example of 3 widgets in a row
    gridColsTablet: 2,
  },
];

const colSpanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
};

const rowSpanClasses: Record<number, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
};

const gridColsTabletClasses: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

const gridColsDesktopClasses: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

interface DragItem {
  id: string;
  index: number;
  stratumId: string;
}

const WidgetHost: React.FC<{
  widget: WidgetConfig;
  index: number;
  stratumId: string;
  move: (from: number, to: number) => void;
}> = ({ widget, index, stratumId, move }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop<DragItem>({
    accept: 'WIDGET',
    hover(item) {
      if (item.stratumId !== stratumId) return;
      if (!ref.current) return;
      if (item.index === index) return;
      move(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: { id: widget.id, index, stratumId } as DragItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const IconComponent = widget.icon;
  const tabletCol = colSpanClasses[widget.colSpanTablet ?? 1] ?? colSpanClasses[1];
  const tabletRow = rowSpanClasses[widget.rowSpanTablet ?? 1] ?? rowSpanClasses[1];
  const desktopCol = colSpanClasses[widget.colSpanDesktop ?? 1] ?? colSpanClasses[1];
  const desktopRow = rowSpanClasses[widget.rowSpanDesktop ?? 1] ?? rowSpanClasses[1];

  return (
    <div ref={ref} className={`${isDragging ? 'opacity-50' : ''}`}>
      <GlassCard
        className={`
          flex flex-col
          md:${tabletCol} md:${tabletRow}
          lg:${desktopCol} lg:${desktopRow}
          !bg-white/3 !border-white/5 !rounded-xl
        `}
      >
        <div className="flex items-center mb-3 cursor-move">
          <IconComponent size={20} className={`${widget.iconColor || 'text-white/80'} mr-2`} />
          <h3 className="text-lg font-semibold text-white/90">{widget.title}</h3>
        </div>
        <div className="flex-grow overflow-y-auto">
          <widget.component {...widget.props} />
        </div>
      </GlassCard>
    </div>
  );
};


export const HomeDashboard: React.FC = () => {
  const { orderedWidgets, moveWidget } = useWidgetLayout(strataConfig);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4 sm:space-y-6">
        {strataConfig.map((stratum) => (
          <section key={stratum.id} aria-labelledby={stratum.id + "-title"}>
            {stratum.title && (
              <h2 id={stratum.id + "-title"} className="text-xl sm:text-2xl font-bold text-white/80 mb-3 ml-1">{stratum.title}</h2>
            )}
            <div
              className={`
                grid gap-3 sm:gap-4
                grid-cols-1
                ${
                  gridColsTabletClasses[stratum.gridColsTablet || 2] ||
                  gridColsTabletClasses[2]
                }
                ${
                  gridColsDesktopClasses[stratum.gridColsDesktop || 4] ||
                  gridColsDesktopClasses[4]
                }
              `}
            >
              {orderedWidgets(stratum).map((widget, index) => (
                <WidgetHost key={widget.id} widget={widget} index={index} stratumId={stratum.id} move={(from, to) => moveWidget(stratum.id, from, to)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DndProvider>
  );
};
