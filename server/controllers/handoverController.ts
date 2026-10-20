import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyWardStaff } from '../services/notificationService.js';

export function getHandovers(req: AuthenticatedRequest, res: Response) {
  try {
    const { wardId, shiftId, date, status } = req.query;

    let query = `
      SELECT h.*, w.name as ward_name, s.name as shift_name, s.code as shift_code,
             u_out.name as outgoing_nurse_name, u_out.employee_id as outgoing_nurse_emp_id,
             u_in.name as incoming_nurse_name, u_in.employee_id as incoming_nurse_emp_id
      FROM handovers h
      JOIN wards w ON h.ward_id = w.id
      JOIN shifts s ON h.shift_id = s.id
      JOIN users u_out ON h.outgoing_nurse_id = u_out.id
      LEFT JOIN users u_in ON h.incoming_nurse_id = u_in.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      query += ` AND h.ward_id = ?`;
      params.push(wardId);
    }
    if (shiftId && shiftId !== 'ALL') {
      query += ` AND h.shift_id = ?`;
      params.push(shiftId);
    }
    if (date) {
      query += ` AND h.date = ?`;
      params.push(date);
    }
    if (status && status !== 'ALL') {
      query += ` AND h.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY h.date DESC, h.created_at DESC`;

    const handovers = db.prepare(query).all(...params);
    return res.json(handovers.map((h: any) => ({
      ...h,
      pendingTaskIds: h.pending_task_ids ? JSON.parse(h.pending_task_ids) : []
    })));
  } catch (err) {
    console.error('getHandovers error:', err);
    return res.status(500).json({ error: 'Failed to fetch handovers' });
  }
}

export function getHandoverById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const handover = db.prepare(`
      SELECT h.*, w.name as ward_name, s.name as shift_name, s.code as shift_code,
             u_out.name as outgoing_nurse_name, u_out.employee_id as outgoing_nurse_emp_id,
             u_in.name as incoming_nurse_name, u_in.employee_id as incoming_nurse_emp_id
      FROM handovers h
      JOIN wards w ON h.ward_id = w.id
      JOIN shifts s ON h.shift_id = s.id
      JOIN users u_out ON h.outgoing_nurse_id = u_out.id
      LEFT JOIN users u_in ON h.incoming_nurse_id = u_in.id
      WHERE h.id = ?
    `).get(id) as any;

    if (!handover) {
      return res.status(404).json({ error: 'Handover report not found' });
    }

    const pendingTaskIds = handover.pending_task_ids ? JSON.parse(handover.pending_task_ids) : [];
    let pendingTasks: any[] = [];

    if (pendingTaskIds.length > 0) {
      const placeholders = pendingTaskIds.map(() => '?').join(',');
      pendingTasks = db.prepare(`
        SELECT t.*, tc.name as category_name, tc.color as category_color, u.name as assigned_to_name
        FROM tasks t
        JOIN task_categories tc ON t.category_id = tc.id
        JOIN users u ON t.assigned_to = u.id
        WHERE t.id IN (${placeholders})
      `).all(...pendingTaskIds);
    }

    const notes = db.prepare(`
      SELECT hn.*, u.name as author_name, u.employee_id as author_emp_id
      FROM handover_notes hn
      JOIN users u ON hn.author_id = u.id
      WHERE hn.handover_id = ?
      ORDER BY hn.created_at ASC
    `).all(id);

    return res.json({
      ...handover,
      pendingTasks,
      notes
    });
  } catch (err) {
    console.error('getHandoverById error:', err);
    return res.status(500).json({ error: 'Failed to fetch handover details' });
  }
}

export function createHandover(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      wardId,
      shiftId,
      date,
      incomingNurseId,
      notes,
      equipmentIssues,
      unresolvedIncidents,
      pendingTaskIds = []
    } = req.body;

    if (!wardId || !shiftId) {
      return res.status(400).json({ error: 'Ward and Shift are required.' });
    }

    const id = crypto.randomUUID();
    const handoverDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO handovers (
        id, ward_id, shift_id, date, outgoing_nurse_id, incoming_nurse_id,
        status, notes, equipment_issues, unresolved_incidents, pending_task_ids,
        completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING_ACKNOWLEDGEMENT', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      wardId,
      shiftId,
      handoverDate,
      req.user.id,
      incomingNurseId || null,
      notes || null,
      equipmentIssues || null,
      unresolvedIncidents || null,
      JSON.stringify(pendingTaskIds)
    );

    // If specific incoming nurse was selected, notify them directly
    if (incomingNurseId) {
      createNotification({
        userId: incomingNurseId,
        title: 'Clinical Handover Awaiting Review',
        message: `${req.user.name} has submitted shift handover. Please review pending tasks and acknowledge.`,
        type: 'HANDOVER',
        priority: 'High',
        link: `/handover/${id}`
      });
    }

    logAudit({
      userId: req.user.id,
      action: 'HANDOVER_CREATE',
      entity: 'HANDOVER',
      recordId: id,
      details: { wardId, shiftId, pendingTaskCount: pendingTaskIds.length },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id, message: 'Shift handover report filed and ready for incoming nurse acknowledgment.' });
  } catch (err) {
    console.error('createHandover error:', err);
    return res.status(500).json({ error: 'Failed to create handover' });
  }
}

export function acknowledgeHandover(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { acknowledgmentNote } = req.body;

    const handover = db.prepare(`SELECT * FROM handovers WHERE id = ?`).get(id) as any;
    if (!handover) return res.status(404).json({ error: 'Handover report not found' });

    db.prepare(`
      UPDATE handovers SET
        incoming_nurse_id = ?,
        status = 'ACKNOWLEDGED',
        acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, id);

    if (acknowledgmentNote) {
      db.prepare(`
        INSERT INTO handover_notes (id, handover_id, author_id, note_type, content, created_at)
        VALUES (?, ?, ?, 'ACKNOWLEDGEMENT', ?, CURRENT_TIMESTAMP)
      `).run(crypto.randomUUID(), id, req.user.id, acknowledgmentNote);
    }

    createNotification({
      userId: handover.outgoing_nurse_id,
      title: 'Handover Acknowledged',
      message: `${req.user.name} has digitally acknowledged and accepted the shift handover report.`,
      type: 'HANDOVER',
      priority: 'Normal',
      link: `/handover/${id}`
    });

    logAudit({
      userId: req.user.id,
      action: 'HANDOVER_ACKNOWLEDGED',
      entity: 'HANDOVER',
      recordId: id,
      details: { outgoingNurse: handover.outgoing_nurse_id, incomingNurse: req.user.id },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Handover successfully reviewed and digitally acknowledged.' });
  } catch (err) {
    console.error('acknowledgeHandover error:', err);
    return res.status(500).json({ error: 'Failed to acknowledge handover' });
  }
}

export function flagIncompleteHandover(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { reason } = req.body;

    db.prepare(`
      UPDATE handovers SET status = 'INCOMPLETE' WHERE id = ?
    `).run(id);

    if (reason) {
      db.prepare(`
        INSERT INTO handover_notes (id, handover_id, author_id, note_type, content, created_at)
        VALUES (?, ?, ?, 'INCIDENT', ?, CURRENT_TIMESTAMP)
      `).run(crypto.randomUUID(), id, req.user.id, `Incomplete handover flagged: ${reason}`);
    }

    logAudit({
      userId: req.user.id,
      action: 'HANDOVER_FLAGGED_INCOMPLETE',
      entity: 'HANDOVER',
      recordId: id,
      details: { reason },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Handover flagged as incomplete for supervisor audit.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to flag handover' });
  }
}
