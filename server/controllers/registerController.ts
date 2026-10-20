import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';

export function getRegisterTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const templates = db.prepare(`SELECT * FROM register_templates WHERE active = 1 ORDER BY name`).all();
    return res.json(templates.map((t: any) => ({
      ...t,
      fieldsSchema: JSON.parse(t.fields_schema)
    })));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch register templates' });
  }
}

export function getRegisterEntries(req: AuthenticatedRequest, res: Response) {
  try {
    const { code, wardId, date, search } = req.query;

    let query = `
      SELECT re.*, w.name as ward_name, u.name as author_name, u.employee_id as author_emp_id,
             rt.name as register_name
      FROM register_entries re
      JOIN wards w ON re.ward_id = w.id
      JOIN users u ON re.user_id = u.id
      JOIN register_templates rt ON re.register_code = rt.code
      WHERE 1=1
    `;
    const params: any[] = [];

    if (code && code !== 'ALL') {
      query += ` AND re.register_code = ?`;
      params.push(code);
    }
    if (wardId && wardId !== 'ALL') {
      query += ` AND re.ward_id = ?`;
      params.push(wardId);
    }
    if (date) {
      query += ` AND re.date = ?`;
      params.push(date);
    }
    if (search) {
      query += ` AND (re.data_json LIKE ? OR u.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY re.created_at DESC LIMIT 100`;

    const entries = db.prepare(query).all(...params);
    return res.json(entries.map((e: any) => ({
      ...e,
      data: JSON.parse(e.data_json)
    })));
  } catch (err) {
    console.error('getRegisterEntries error:', err);
    return res.status(500).json({ error: 'Failed to fetch register entries' });
  }
}

export function getRegisterEntryById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const entry = db.prepare(`
      SELECT re.*, w.name as ward_name, u.name as author_name, u.employee_id as author_emp_id,
             rt.name as register_name
      FROM register_entries re
      JOIN wards w ON re.ward_id = w.id
      JOIN users u ON re.user_id = u.id
      JOIN register_templates rt ON re.register_code = rt.code
      WHERE re.id = ?
    `).get(id) as any;

    if (!entry) {
      return res.status(404).json({ error: 'Register entry not found' });
    }

    // Get audit version history
    const history = db.prepare(`
      SELECT reh.*, u.name as edited_by_name, u.employee_id as edited_by_emp_id
      FROM register_entry_history reh
      JOIN users u ON reh.user_id = u.id
      WHERE reh.entry_id = ?
      ORDER BY reh.version DESC
    `).all(id);

    return res.json({
      ...entry,
      data: JSON.parse(entry.data_json),
      history: history.map((h: any) => ({
        ...h,
        data: JSON.parse(h.data_json)
      }))
    });
  } catch (err) {
    console.error('getRegisterEntryById error:', err);
    return res.status(500).json({ error: 'Failed to retrieve register entry' });
  }
}

export function createRegisterEntry(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { registerCode, wardId, date, data } = req.body;

    if (!registerCode || !wardId || !data) {
      return res.status(400).json({ error: 'Register type, ward, and entry data are required.' });
    }

    const id = crypto.randomUUID();
    const entryDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO register_entries (
        id, register_code, ward_id, user_id, date, data_json, status, current_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'FINAL', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      registerCode,
      wardId,
      req.user.id,
      entryDate,
      JSON.stringify(data)
    );

    logAudit({
      userId: req.user.id,
      action: 'REGISTER_ENTRY_CREATE',
      entity: 'REGISTER',
      recordId: id,
      details: { registerCode, wardId, date: entryDate },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id, message: 'Register entry recorded successfully' });
  } catch (err) {
    console.error('createRegisterEntry error:', err);
    return res.status(500).json({ error: 'Failed to save register entry' });
  }
}

export function updateRegisterCorrection(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { data, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A clinical reason for correction is strictly required by hospital policy.' });
    }

    const existing = db.prepare(`SELECT * FROM register_entries WHERE id = ?`).get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Register entry not found' });
    }

    // 1. Archive the existing state into register_entry_history (preserving original)
    const historyId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO register_entry_history (id, entry_id, version, user_id, data_json, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      historyId,
      id,
      existing.current_version,
      req.user.id,
      existing.data_json,
      reason.trim()
    );

    // 2. Update current entry with new version and status 'AMENDED'
    const newVersion = existing.current_version + 1;
    db.prepare(`
      UPDATE register_entries
      SET data_json = ?, status = 'AMENDED', current_version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(data), newVersion, id);

    logAudit({
      userId: req.user.id,
      action: 'REGISTER_ENTRY_CORRECTION',
      entity: 'REGISTER',
      recordId: id,
      details: {
        version: newVersion,
        reason: reason.trim(),
        previousVersion: existing.current_version
      },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Correction recorded as version ${newVersion}. Original entry preserved in audit log.`
    });
  } catch (err) {
    console.error('updateRegisterCorrection error:', err);
    return res.status(500).json({ error: 'Failed to record register correction' });
  }
}
