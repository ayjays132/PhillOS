import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';

interface Notification {
  id: number;
  text: string;
}

export const LockScreenNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      } catch {
        setNotifications([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!notifications.length) return null;

  return (
    <GlassCard className="mt-4 w-60 text-sm text-center">
      <div className="font-semibold mb-2">Notifications</div>
      <ul className="space-y-1">
        {notifications.map(n => (
          <li key={n.id}>{n.text}</li>
        ))}
      </ul>
    </GlassCard>
  );
};

export default LockScreenNotifications;
