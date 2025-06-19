
import React from 'react';
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

const WidgetHost: React.FC<{ widget: WidgetConfig }> = ({ widget }) => {
  const IconComponent = widget.icon;
  return (
    <GlassCard 
      className={`
        flex flex-col 
        md:col-span-${widget.colSpanTablet || 1} md:row-span-${widget.rowSpanTablet || 1}
        lg:col-span-${widget.colSpanDesktop || 1} lg:row-span-${widget.rowSpanDesktop || 1}
        !bg-white/3 !border-white/5 !rounded-xl
      `}
    >
      <div className="flex items-center mb-3">
        <IconComponent size={20} className={`${widget.iconColor || 'text-white/80'} mr-2`} />
        <h3 className="text-lg font-semibold text-white/90">{widget.title}</h3>
      </div>
      <div className="flex-grow overflow-y-auto">
        <widget.component {...widget.props} />
      </div>
    </GlassCard>
  );
};


export const HomeDashboard: React.FC = () => {
  return (
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
              md:grid-cols-${stratum.gridColsTablet || 2} 
              lg:grid-cols-${stratum.gridColsDesktop || 4}
            `}
          >
            {stratum.widgets.map((widget) => (
              <WidgetHost key={widget.id} widget={widget} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
