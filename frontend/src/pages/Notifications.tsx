import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { apiRequest } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  time: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

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

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-success" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning" />,
    info: <Info className="h-4 w-4 text-primary" />,
  };

  const bgMap = {
    success: 'bg-success/10 border-success/30',
    warning: 'bg-warning/10 border-warning/30',
    info: 'bg-primary/10 border-primary/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with market alerts and account activity.</p>
        </div>
        {unread > 0 && (
          <Badge variant="default" className="text-xs">{unread} unread</Badge>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`border ${bgMap[notif.type]} ${notif.read ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{iconMap[notif.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{notif.title}</p>
                    {!notif.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notif.read && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(notif.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => dismiss(notif.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
