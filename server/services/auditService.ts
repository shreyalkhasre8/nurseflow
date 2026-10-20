import { db } from '../config/db.js';
import crypto from 'crypto';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  recordId?: string | null;
  details?: any;
  ipAddress?: string;
}

export function logAudit(input: AuditLogInput) {
  try {
    const id = crypto.randomUUID();
    const detailsStr = typeof input.details === 'object' ? JSON.stringify(input.details) : (input.details || null);
    
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity, record_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.userId || null,
      input.action,
      input.entity,
      input.recordId || null,
      detailsStr,
      input.ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
