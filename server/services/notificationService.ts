import { db } from '../config/db.js';
import crypto from 'crypto';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: 'TASK' | 'SHIFT' | 'HANDOVER' | 'INVENTORY' | 'SYSTEM' | 'ESCALATION';
  priority?: 'Normal' | 'High' | 'Urgent';
  link?: string;
}

export function createNotification(input: CreateNotificationInput) {
  try {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, priority, link, is_read, is_acknowledged)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
    `);

    stmt.run(
      id,
      input.userId,
      input.title,
      input.message,
      input.type,
      input.priority || 'Normal',
      input.link || null
    );

    return id;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

export function notifyWardStaff(wardId: string, input: Omit<CreateNotificationInput, 'userId'>) {
  try {
    const nurses = db.prepare(`SELECT id FROM users WHERE ward_id = ? AND status = 'ACTIVE'`).all(wardId) as { id: string }[];
    for (const nurse of nurses) {
      createNotification({ ...input, userId: nurse.id });
    }
  } catch (err) {
    console.error('Failed to notify ward staff:', err);
  }
}

export function notifyRole(roleName: string, input: Omit<CreateNotificationInput, 'userId'>) {
  try {
    const users = db.prepare(`
      SELECT u.id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = ? AND u.status = 'ACTIVE'
    `).all(roleName) as { id: string }[];

    for (const user of users) {
      createNotification({ ...input, userId: user.id });
    }
  } catch (err) {
    console.error(`Failed to notify role ${roleName}:`, err);
  }
}
