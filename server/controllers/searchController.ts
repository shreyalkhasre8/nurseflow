import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export function globalSearch(req: AuthenticatedRequest, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ tasks: [], inventory: [], staff: [], registers: [], handovers: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    // 1. Tasks
    const tasks = db.prepare(`
      SELECT t.id, t.title, t.priority, t.status, t.due_date, t.patient_reference,
             w.name as ward_name, tc.name as category_name
      FROM tasks t
      JOIN wards w ON t.ward_id = w.id
      JOIN task_categories tc ON t.category_id = tc.id
      WHERE t.title LIKE ? OR t.description LIKE ? OR t.patient_reference LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm);

    // 2. Inventory Items
    const inventory = db.prepare(`
      SELECT i.id, i.code, i.name, i.category, i.unit,
             COALESCE((SELECT SUM(quantity) FROM inventory_batches WHERE item_id = i.id AND quantity > 0), 0) as current_stock
      FROM inventory_items i
      WHERE i.name LIKE ? OR i.code LIKE ? OR i.category LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm);

    // 3. Staff
    const staff = db.prepare(`
      SELECT u.id, u.name, u.employee_id, r.name as role_name, w.name as ward_name, d.name as department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN wards w ON u.ward_id = w.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.name LIKE ? OR u.employee_id LIKE ? OR u.email LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm);

    // 4. Register Entries
    const registers = db.prepare(`
      SELECT re.id, re.register_code, re.date, w.name as ward_name, u.name as author_name, rt.name as register_name
      FROM register_entries re
      JOIN wards w ON re.ward_id = w.id
      JOIN users u ON re.user_id = u.id
      JOIN register_templates rt ON re.register_code = rt.code
      WHERE re.data_json LIKE ? OR rt.name LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm);

    // 5. Handovers
    const handovers = db.prepare(`
      SELECT h.id, h.date, h.status, w.name as ward_name, s.name as shift_name, u.name as outgoing_nurse_name
      FROM handovers h
      JOIN wards w ON h.ward_id = w.id
      JOIN shifts s ON h.shift_id = s.id
      JOIN users u ON h.outgoing_nurse_id = u.id
      WHERE h.notes LIKE ? OR h.equipment_issues LIKE ? OR w.name LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm);

    return res.json({
      tasks,
      inventory,
      staff,
      registers,
      handovers
    });
  } catch (err) {
    console.error('globalSearch error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
