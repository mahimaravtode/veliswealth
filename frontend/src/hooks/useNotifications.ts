import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  time: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [movers, health] = await Promise.all([
        apiRequest('/market/movers').catch(() => null),
        apiRequest('/health/score').catch(() => null),
      ]);

      const notifs: Notification[] = [];
      const now = new Date().toLocaleTimeString();

      if (movers?.up5Percent?.length > 0) {
        notifs.push({
          id: '1', title: 'Upper Circuit Alert',
          message: `${movers.up5Percent.length} stock(s) hit upper circuit today.`,
          type: 'warning', time: now, read: false,
        });
      }
      if (movers?.down5Percent?.length > 0) {
        notifs.push({
          id: '2', title: 'Lower Circuit Alert',
          message: `${movers.down5Percent.length} stock(s) hit lower circuit today.`,
          type: 'warning', time: now, read: false,
        });
      }
      if (health?.score >= 70) {
        notifs.push({
          id: '3', title: 'Health Score Good',
          message: `Your financial health score is ${health.score}/100.`,
          type: 'success', time: now, read: false,
        });
      } else if (health?.score > 0) {
        notifs.push({
          id: '4', title: 'Improve Health Score',
          message: `Your financial health score is ${health.score}/100. Review insights.`,
          type: 'info', time: now, read: false,
        });
      }

      notifs.push({
        id: '5', title: 'Market Open',
        message: 'Indian markets are currently open for trading.',
        type: 'info', time: now, read: false,
      });

      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = (id: string) => {
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
  };

  const dismiss = (id: string) => {
    setNotifications(n => n.filter(notif => notif.id !== id));
  };

  const unread = notifications.filter(n => !n.read).length;

  return { notifications, loading, unread, markRead, dismiss };
}
