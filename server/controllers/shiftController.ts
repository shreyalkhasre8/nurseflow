import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export function getShifts(req: AuthenticatedRequest, res: Response) {
  try {
    const shifts = db.prepare(`SELECT * FROM shifts ORDER BY start_time ASC`).all();
    return res.json(shifts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch shift types' });
  }
}

export function getShiftAssignments(req: AuthenticatedRequest, res: Response) {
  try {
    const { date, startDate, endDate, wardId, userId } = req.query;

    let query = `
      SELECT sa.*, s.name as shift_name, s.code as shift_code, s.start_time, s.end_time,
             u.name as staff_name, u.employee_id, r.name as role_name,
             w.name as ward_name, d.name as department_name
      FROM shift_assignments sa
      JOIN shifts s ON sa.shift_id = s.id
      JOIN users u ON sa.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      JOIN wards w ON sa.ward_id = w.id
      LEFT JOIN departments d ON w.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ` AND sa.date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND sa.date >= ? AND sa.date <= ?`;
      params.push(startDate, endDate);
    }

    if (wardId && wardId !== 'ALL') {
      query += ` AND sa.ward_id = ?`;
      params.push(wardId);
    }
    if (userId && userId !== 'ALL') {
      query += ` AND sa.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY sa.date ASC, s.start_time ASC, u.name ASC`;

    const assignments = db.prepare(query).all(...params);
    return res.json(assignments);
  } catch (err) {
    console.error('getShiftAssignments error:', err);
    return res.status(500).json({ error: 'Failed to fetch shift assignments' });
  }
}

export function assignShift(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { shiftId, userId, wardId, date, notes } = req.body;

    if (!shiftId || !userId || !wardId || !date) {
      return res.status(400).json({ error: 'Shift, staff, ward, and date are required.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO shift_assignments (id, shift_id, user_id, ward_id, date, status, notes)
      VALUES (?, ?, ?, ?, ?, 'SCHEDULED', ?)
    `).run(id, shiftId, userId, wardId, date, notes || null);

    const shift = db.prepare(`SELECT * FROM shifts WHERE id = ?`).get(shiftId) as any;
    const ward = db.prepare(`SELECT * FROM wards WHERE id = ?`).get(wardId) as any;

    createNotification({
      userId,
      title: 'Shift Duty Scheduled',
      message: `You are rostered for ${shift?.name} (${shift?.start_time} - ${shift?.end_time}) on ${date} at ${ward?.name}.`,
      type: 'SHIFT',
      priority: 'Normal',
      link: '/shifts'
    });

    logAudit({
      userId: req.user.id,
      action: 'SHIFT_ASSIGNMENT_CREATE',
      entity: 'SHIFT_ASSIGNMENT',
      recordId: id,
      details: { shift: shift?.name, date, ward: ward?.name, staffId: userId },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id, message: 'Shift duty assigned successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to assign shift duty' });
  }
}

export function updateAssignmentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { status } = req.body;

    if (!['SCHEDULED', 'ON_DUTY', 'COMPLETED', 'ABSENT', 'SWAPPED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid shift status' });
    }

    db.prepare(`UPDATE shift_assignments SET status = ? WHERE id = ?`).run(status, id);

    logAudit({
      userId: req.user.id,
      action: 'SHIFT_STATUS_UPDATE',
      entity: 'SHIFT_ASSIGNMENT',
      recordId: id,
      details: { status },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Shift assignment status updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update assignment status' });
  }
}

export function getStaffAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const availability = db.prepare(`
      SELECT sa.*, u.name as staff_name, u.employee_id, r.name as role_name
      FROM staff_availability sa
      JOIN users u ON sa.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE sa.date = ?
    `).all(targetDate);

    return res.json(availability);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch staff availability' });
  }
}

export function setStaffAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { userId, date, status, reason } = req.body;

    if (!userId || !date || !status) {
      return res.status(400).json({ error: 'Staff, date, and status are required' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO staff_availability (id, user_id, date, status, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, date, status, reason || null);

    return res.json({ message: 'Staff availability recorded' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record availability' });
  }
}
