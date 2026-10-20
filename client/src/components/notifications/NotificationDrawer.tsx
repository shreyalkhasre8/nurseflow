import React, { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Bell, CheckCheck, Trash2, ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api';
import { InAppNotification } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      onUpdated?.();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      onUpdated?.();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeNotification(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_acknowledged: 1, is_read: 1 } : n))
      );
      onUpdated?.();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      onUpdated?.();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNavigate = (link?: string) => {
    if (!link) return;
    onClose();
    navigate(link);
  };

  const filteredList =
    filter === 'unread' ? notifications.filter((n) => n.is_read === 0) : notifications;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Operational Notifications & Alerts" width="lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({notifications.filter((n) => n.is_read === 0).length})
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} icon={<CheckCheck className="w-3.5 h-3.5" />}>
          Mark All Read
        </Button>
      </div>

      <div className="divide-y divide-slate-100 mt-2">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No notifications in this view.</p>
          </div>
        ) : (
          filteredList.map((n) => (
            <div
              key={n.id}
              className={`py-3.5 px-2 rounded-md transition-colors ${
                n.is_read === 0 ? 'bg-teal-50/40' : 'bg-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-900">{n.title}</span>
                    <Badge
                      variant={
                        n.priority === 'Urgent'
                          ? 'urgent'
                          : n.priority === 'High'
                          ? 'high'
                          : 'neutral'
                      }
                    >
                      {n.priority}
                    </Badge>
                    {n.is_acknowledged === 1 && (
                      <Badge variant="completed">Acknowledged</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {n.link && (
                    <button
                      onClick={() => handleNavigate(n.link)}
                      className="p-1 text-teal-700 hover:bg-teal-100 rounded transition-colors"
                      title="Open related record"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                  {n.is_acknowledged === 0 && (
                    <button
                      onClick={() => handleAcknowledge(n.id)}
                      className="text-[11px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded transition-colors"
                      title="Acknowledge alert"
                    >
                      Ack
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
};
