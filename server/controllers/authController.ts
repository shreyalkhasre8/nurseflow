import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { AuthenticatedRequest, generateToken } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';

export function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { username, password } = req.body; // username can be email or employeeId

    if (!username || !password) {
      return res.status(400).json({ error: 'Please provide Employee ID/Email and Password.' });
    }

    const user = db.prepare(`
      SELECT u.*, r.name as role_name, d.name as department_name, w.name as ward_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN wards w ON u.ward_id = w.id
      WHERE (LOWER(u.email) = LOWER(?) OR LOWER(u.employee_id) = LOWER(?))
    `).get(username.trim(), username.trim()) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your Employee ID and password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: `Account is ${user.status.toLowerCase()}. Please contact your clinical administrator.` });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your password.' });
    }

    // Update last login
    db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);

    const authUser = {
      id: user.id,
      employeeId: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      departmentId: user.department_id,
      departmentName: user.department_name,
      wardId: user.ward_id,
      wardName: user.ward_name,
    };

    const token = generateToken(authUser);

    logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'AUTH',
      recordId: user.id,
      details: { role: user.role_name, ward: user.ward_name },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      token,
      user: authUser
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = db.prepare(`
      SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.status, u.last_login,
             r.name as role, d.id as department_id, d.name as department_name,
             w.id as ward_id, w.name as ward_name,
             sp.qualification, sp.registration_no
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN wards w ON u.ward_id = w.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `).get(req.user.id) as any;

    if (!user) {
      return res.status(404).json({ error: 'User record not found' });
    }

    return res.json({
      id: user.id,
      employeeId: user.employee_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      departmentId: user.department_id,
      departmentName: user.department_name,
      wardId: user.ward_id,
      wardName: user.ward_name,
      qualification: user.qualification,
      registrationNo: user.registration_no,
      lastLogin: user.last_login
    });
  } catch (err: any) {
    console.error('Get current user error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
}

export function logout(req: AuthenticatedRequest, res: Response) {
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'USER_LOGOUT',
      entity: 'AUTH',
      recordId: req.user.id,
      details: { role: req.user.role },
      ipAddress: req.ip || '127.0.0.1'
    });
  }
  return res.json({ message: 'Logged out successfully' });
}

export function getDemoUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = db.prepare(`
      SELECT u.id, u.employee_id, u.name, u.email, r.name as role,
             w.name as ward_name, d.name as department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN wards w ON u.ward_id = w.id
      WHERE u.status = 'ACTIVE'
      ORDER BY r.name, u.name
    `).all();

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demo users' });
  }
}

export function forgotPassword(req: AuthenticatedRequest, res: Response) {
  const { email } = req.body;
  const user = db.prepare(`SELECT id, name FROM users WHERE LOWER(email) = LOWER(?)`).get(email) as any;
  if (!user) {
    // Standard security: do not disclose existence
    return res.json({ message: 'If an active account exists with this email, reset instructions have been forwarded to supervisor.' });
  }

  logAudit({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entity: 'AUTH',
    recordId: user.id,
    details: { requestedFor: email },
    ipAddress: req.ip || '127.0.0.1'
  });

  return res.json({
    message: `Password reset request logged for ${user.name}. Clinical supervisor can reset your credential, or use standard demo password 'hospital123'.`
  });
}
