
import React from 'react';
import { Lightbulb, CalendarDays, MapPin } from 'lucide-react';
import { WidgetCard } from '../layout/WidgetCard';

const mockStreamItems = [
  { id: 1, icon: Lightbulb, text: "AI Suggestion: Review Q3 financial report based on recent activity.", time: "2m ago", iconColor: "text-yellow-300" },
  { id: 2, icon: CalendarDays, text: "Upcoming: Team Sync meeting in 15 minutes.", time: "5m ago", iconColor: "text-blue-300" },
  { id: 3, icon: MapPin, text: "Context: You are currently at 'Home'. Traffic to 'Office' is light.", time: "10m ago", iconColor: "text-green-300" },
  { id: 4, icon: Lightbulb, text: "Reminder: Call Sarah about project update.", time: "30m ago", iconColor: "text-yellow-300" },
];

export const ContextStreamWidget: React.FC = () => {
  return (
    <WidgetCard className="space-y-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {mockStreamItems.map(item => (
        <div key={item.id} className="flex items-start p-2.5 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
          <item.icon size={18} className={`${item.iconColor} mr-2.5 mt-0.5 flex-shrink-0`} />
          <div className="flex-grow">
            <p className="text-sm text-white/80 leading-snug">{item.text}</p>
            <p className="text-xs text-white/50 mt-0.5">{item.time}</p>
          </div>
        </div>
      ))}
    </WidgetCard>
  );
};
