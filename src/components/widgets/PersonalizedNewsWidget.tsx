
import React from 'react';
import { Newspaper, Zap, Brain } from 'lucide-react';
import { WidgetCard } from '../layout/WidgetCard';

const mockNewsItems = [
  { id: 1, title: "AI Breakthrough: New Model Achieves Human-Level Understanding", source: "Tech Chronicle", time: "1h ago", category: "AI", icon: Brain, iconColor: "text-purple-300" },
  { id: 2, title: "Future of Gaming: Cloud Streaming vs. Local Hardware", source: "GameDev Weekly", time: "3h ago", category: "Gaming", icon: Zap, iconColor: "text-pink-300" },
  { id: 3, title: "Ethereal OS Design: The Next Frontier in UX?", source: "Design Insights", time: "5h ago", category: "Design", icon: Newspaper, iconColor: "text-blue-300" },
];

export const PersonalizedNewsWidget: React.FC = () => {
  return (
    <WidgetCard className="space-y-2.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {mockNewsItems.map(item => (
        <div key={item.id} className="p-2.5 bg-black/10 rounded-lg hover:bg-black/20 transition-colors cursor-pointer">
          <div className="flex items-center mb-1">
            <item.icon size={16} className={`${item.iconColor} mr-1.5 flex-shrink-0`} />
            <span className={`text-xs font-medium ${item.iconColor}`}>{item.category}</span>
          </div>
          <h5 className="text-sm font-semibold text-white/85 mb-0.5 leading-snug">{item.title}</h5>
          <div className="flex justify-between items-center text-xs text-white/50">
            <span>{item.source}</span>
            <span>{item.time}</span>
          </div>
        </div>
      ))}
    </WidgetCard>
  );
};
