import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';

export function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { roleId, departmentId, wardId, status, search } = req.query;

    let query = `
      SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.status, u.last_login, u.created_at,
             r.id as role_id, r.name as role_name,
             d.id as department_id, d.name as department_name,
             w.id as ward_id, w.name as ward_name,
             sp.qualification, sp.registration_no
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN wards w ON u.ward_id = w.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (roleId && roleId !== 'ALL') {
      query += ` AND u.role_id = ?`;
      params.push(roleId);
    }
    if (departmentId && departmentId !== 'ALL') {
      query += ` AND u.department_id = ?`;
      params.push(departmentId);
    }
    if (wardId && wardId !== 'ALL') {
      query += ` AND u.ward_id = ?`;
      params.push(wardId);
    }
    if (status && status !== 'ALL') {
      query += ` AND u.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (u.name LIKE ? OR u.employee_id LIKE ? OR u.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY u.name ASC`;

    const users = db.prepare(query).all(...params);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { employeeId, name, email, password, roleId, departmentId, wardId, phone, qualification, registrationNo } = req.body;

    if (!employeeId || !name || !email || !password || !roleId) {
      return res.status(400).json({ error: 'Employee ID, Name, Email, Password, and Role are required.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, employee_id, name, email, password_hash, role_id, department_id, ward_id, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      userId,
      employeeId.trim().toUpperCase(),
      name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      roleId,
      departmentId || null,
      wardId || null,
      phone || null
    );

    // Create staff profile
    db.prepare(`
      INSERT INTO staff_profiles (id, user_id, qualification, registration_no, date_of_joining)
      VALUES (?, ?, ?, ?, date('now'))
    `).run(crypto.randomUUID(), userId, qualification || null, registrationNo || null);

    logAudit({
      userId: req.user.id,
      action: 'USER_CREATED',
      entity: 'USER',
      recordId: userId,
      details: { employeeId, name, email, roleId },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id: userId, message: 'User account created successfully' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Employee ID or Email already exists' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

export function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { name, email, roleId, departmentId, wardId, phone, status } = req.body;

    const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any;
    if (!existing) return res.status(404).json({ error: 'User not found' });

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        role_id = COALESCE(?, role_id),
        department_id = COALESCE(?, department_id),
        ward_id = COALESCE(?, ward_id),
        phone = COALESCE(?, phone),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, email, roleId, departmentId, wardId, phone, status, id);

    logAudit({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entity: 'USER',
      recordId: id,
      details: { previousStatus: existing.status, newStatus: status, roleId },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'User details updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

export function resetPassword(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { newPassword } = req.body;

    const targetUser = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(id) as any;
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const passwordToSet = newPassword || 'hospital123';
    const passwordHash = bcrypt.hashSync(passwordToSet, 10);

    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, id);

    logAudit({
      userId: req.user.id,
      action: 'USER_PASSWORD_RESET',
      entity: 'USER',
      recordId: id,
      details: { targetUserName: targetUser.name },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Password reset successfully for ${targetUser.name}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

export function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { action, entity, userId, limit = 100 } = req.query;

    let query = `
      SELECT al.*, u.name as user_name, u.employee_id
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action && action !== 'ALL') {
      query += ` AND al.action = ?`;
      params.push(action);
    }
    if (entity && entity !== 'ALL') {
      query += ` AND al.entity = ?`;
      params.push(entity);
    }
    if (userId && userId !== 'ALL') {
      query += ` AND al.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ?`;
    params.push(parseInt(String(limit), 10));

    const logs = db.prepare(query).all(...params);
    return res.json(logs.map((log: any) => ({
      ...log,
      detailsParsed: log.details ? (() => { try { return JSON.parse(log.details); } catch { return log.details; } })() : null
    })));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

export function getDepartments(req: AuthenticatedRequest, res: Response) {
  try {
    const departments = db.prepare(`
      SELECT d.*, COUNT(w.id) as ward_count
      FROM departments d
      LEFT JOIN wards w ON d.id = w.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();
    return res.json(departments);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
}

export function getWards(req: AuthenticatedRequest, res: Response) {
  try {
    const { departmentId } = req.query;
    let query = `
      SELECT w.*, d.name as department_name,
             (SELECT COUNT(*) FROM users u WHERE u.ward_id = w.id AND u.status = 'ACTIVE') as active_staff_count
      FROM wards w
      JOIN departments d ON w.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (departmentId && departmentId !== 'ALL') {
      query += ` AND w.department_id = ?`;
      params.push(departmentId);
    }

    query += ` ORDER BY w.name ASC`;
    const wards = db.prepare(query).all(...params);
    return res.json(wards);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch wards' });
  }
}

export function getRoles(req: AuthenticatedRequest, res: Response) {
  try {
    const roles = db.prepare(`SELECT * FROM roles ORDER BY name ASC`).all();
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
}
