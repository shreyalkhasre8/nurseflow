import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id) as any;

    return res.json({
      notifications,
      unreadCount: unreadCount?.count || 0
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(id, req.user.id);
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notification' });
  }
}

export function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(req.user.id);
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark all notifications' });
  }
}

export function acknowledgeNotification(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    db.prepare(`
      UPDATE notifications SET is_acknowledged = 1, is_read = 1 WHERE id = ? AND user_id = ?
    `).run(id, req.user.id);

    return res.json({ message: 'Notification acknowledged' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to acknowledge notification' });
  }
}

export function deleteNotification(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    db.prepare(`DELETE FROM notifications WHERE id = ? AND user_id = ?`).run(id, req.user.id);
    return res.json({ message: 'Notification dismissed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
}
