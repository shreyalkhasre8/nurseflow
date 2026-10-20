import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';

export function getPatients(req: AuthenticatedRequest, res: Response) {
  try {
    const { wardId, status = 'ADMITTED', search } = req.query;

    let query = `
      SELECT p.*, w.name as ward_name, w.floor, d.name as department_name
      FROM patients p
      JOIN wards w ON p.ward_id = w.id
      LEFT JOIN departments d ON w.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      query += ` AND p.ward_id = ?`;
      params.push(wardId);
    }

    if (status && status !== 'ALL') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.uhid LIKE ? OR p.bed_number LIKE ? OR p.diagnosis LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY p.ward_id ASC, p.bed_number ASC`;

    const patients = db.prepare(query).all(...params);
    return res.json(patients);
  } catch (err) {
    console.error('getPatients error:', err);
    return res.status(500).json({ error: 'Failed to fetch patients census' });
  }
}

export function getPatientById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const patient = db.prepare(`
      SELECT p.*, w.name as ward_name, w.floor, d.name as department_name
      FROM patients p
      JOIN wards w ON p.ward_id = w.id
      LEFT JOIN departments d ON w.department_id = d.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const tasks = db.prepare(`
      SELECT t.*, tc.name as category_name, tc.color as category_color, u.name as assigned_to_name
      FROM tasks t
      JOIN task_categories tc ON t.category_id = tc.id
      JOIN users u ON t.assigned_to = u.id
      WHERE t.patient_reference LIKE ? OR t.patient_reference LIKE ?
      ORDER BY t.due_date DESC
      LIMIT 20
    `).all(`%${patient.uhid}%`, `%${patient.name}%`);

    return res.json({
      ...patient,
      tasks
    });
  } catch (err) {
    console.error('getPatientById error:', err);
    return res.status(500).json({ error: 'Failed to fetch patient details' });
  }
}

export function createPatient(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { uhid, name, age, gender, wardId, bedNumber, admissionDate, diagnosis, attendingDoctor } = req.body;

    if (!uhid || !name || !age || !gender || !wardId || !bedNumber) {
      return res.status(400).json({ error: 'UHID, name, age, gender, ward, and bed number are required.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO patients (id, uhid, name, age, gender, ward_id, bed_number, admission_date, diagnosis, attending_doctor, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ADMITTED')
    `).run(
      id,
      uhid.trim().toUpperCase(),
      name.trim(),
      parseInt(age, 10),
      gender,
      wardId,
      bedNumber.trim(),
      admissionDate || new Date().toISOString().split('T')[0],
      diagnosis || null,
      attendingDoctor || null
    );

    logAudit({
      userId: req.user.id,
      action: 'PATIENT_ADMITTED',
      entity: 'PATIENT',
      recordId: id,
      details: { uhid, name, wardId, bedNumber },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id, message: 'Patient admitted successfully' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'UHID already exists' });
    }
    return res.status(500).json({ error: 'Failed to admit patient' });
  }
}

export function updatePatient(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { wardId, bedNumber, diagnosis, attendingDoctor, status } = req.body;

    const existing = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id) as any;
    if (!existing) return res.status(404).json({ error: 'Patient not found' });

    db.prepare(`
      UPDATE patients SET
        ward_id = COALESCE(?, ward_id),
        bed_number = COALESCE(?, bed_number),
        diagnosis = COALESCE(?, diagnosis),
        attending_doctor = COALESCE(?, attending_doctor),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(wardId || null, bedNumber || null, diagnosis || null, attendingDoctor || null, status || null, id);

    logAudit({
      userId: req.user.id,
      action: 'PATIENT_UPDATED',
      entity: 'PATIENT',
      recordId: id as string,
      details: { previousStatus: existing.status, newStatus: status, bedNumber },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Patient details updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update patient' });
  }
}
