import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export function getTaskSummaryReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, wardId } = req.query;

    let wardClause = '';
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      wardClause = ` AND ward_id = ?`;
      params.push(wardId);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE 1=1 ${wardClause}`).get(...params) as any;
    const completed = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed' ${wardClause}`).get(...params) as any;
    const pending = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending' ${wardClause}`).get(...params) as any;
    const inProgress = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE status = 'In Progress' ${wardClause}`).get(...params) as any;
    const overdue = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE status NOT IN ('Completed', 'Cancelled')
        AND datetime(due_date) < datetime('now') ${wardClause}
    `).get(...params) as any;

    // Daily breakdown for the past 7 days (or selected period)
    const dailyBreakdown = db.prepare(`
      SELECT
        substr(created_at, 1, 10) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status NOT IN ('Completed', 'Cancelled') AND datetime(due_date) < datetime('now') THEN 1 ELSE 0 END) as overdue
      FROM tasks
      WHERE 1=1 ${wardClause}
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date DESC
      LIMIT 7
    `).all(...params);

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT tc.name as category, COUNT(t.id) as count
      FROM tasks t
      JOIN task_categories tc ON t.category_id = tc.id
      WHERE 1=1 ${wardClause.replace(/ward_id/g, 't.ward_id')}
      GROUP BY tc.id
      ORDER BY count DESC
    `).all(...params);

    return res.json({
      summary: {
        total: total?.count || 0,
        completed: completed?.count || 0,
        pending: pending?.count || 0,
        inProgress: inProgress?.count || 0,
        overdue: overdue?.count || 0,
        completionRate: total?.count ? Math.round((completed?.count / total?.count) * 100) : 0
      },
      dailyBreakdown: dailyBreakdown.reverse(),
      categoryBreakdown
    });
  } catch (err) {
    console.error('getTaskSummaryReport error:', err);
    return res.status(500).json({ error: 'Failed to generate task summary report' });
  }
}

export function getWorkloadReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { wardId } = req.query;
    let query = `
      SELECT u.id, u.name, u.employee_id, w.name as ward_name,
             COUNT(t.id) as total_tasks,
             SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
             SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
             SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
             SUM(CASE WHEN t.status NOT IN ('Completed', 'Cancelled') AND datetime(t.due_date) < datetime('now') THEN 1 ELSE 0 END) as overdue_tasks
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN wards w ON u.ward_id = w.id
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE r.name = 'Nurse' AND u.status = 'ACTIVE'
    `;
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      query += ` AND u.ward_id = ?`;
      params.push(wardId);
    }

    query += ` GROUP BY u.id ORDER BY total_tasks DESC`;

    const workload = db.prepare(query).all(...params);
    return res.json(workload);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate workload report' });
  }
}

export function getInventoryConsumptionReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { wardId } = req.query;

    let query = `
      SELECT i.id, i.code, i.name, i.category, i.unit,
             COALESCE(SUM(CASE WHEN t.type = 'ISSUED' THEN t.quantity ELSE 0 END), 0) as issued_qty,
             COALESCE(SUM(CASE WHEN t.type = 'RECEIVED' THEN t.quantity ELSE 0 END), 0) as received_qty,
             COALESCE(SUM(CASE WHEN t.type = 'RETURNED' THEN t.quantity ELSE 0 END), 0) as returned_qty,
             COALESCE(SUM(CASE WHEN t.type = 'ADJUSTED' THEN t.quantity ELSE 0 END), 0) as adjusted_qty,
             COALESCE((SELECT SUM(quantity) FROM inventory_batches WHERE item_id = i.id AND quantity > 0), 0) as current_stock
      FROM inventory_items i
      LEFT JOIN inventory_transactions t ON i.id = t.item_id
    `;
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      query += ` AND t.ward_id = ?`;
      params.push(wardId);
    }

    query += ` GROUP BY i.id ORDER BY issued_qty DESC`;

    const consumption = db.prepare(query).all(...params);
    return res.json(consumption);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate inventory consumption report' });
  }
}

export function getHandoverComplianceReport(req: AuthenticatedRequest, res: Response) {
  try {
    const compliance = db.prepare(`
      SELECT w.name as ward_name,
             COUNT(h.id) as total_handovers,
             SUM(CASE WHEN h.status = 'ACKNOWLEDGED' THEN 1 ELSE 0 END) as acknowledged_handovers,
             SUM(CASE WHEN h.status = 'PENDING_ACKNOWLEDGEMENT' THEN 1 ELSE 0 END) as pending_handovers,
             SUM(CASE WHEN h.status = 'INCOMPLETE' THEN 1 ELSE 0 END) as incomplete_handovers
      FROM wards w
      LEFT JOIN handovers h ON w.id = h.ward_id
      GROUP BY w.id
    `).all();

    return res.json(compliance);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate handover compliance report' });
  }
}

export function getOverdueTasksReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { wardId } = req.query;
    let query = `
      SELECT t.id, t.title, t.priority, t.status, t.due_date, t.patient_reference,
             u.name as assigned_to_name, u.employee_id as assigned_to_emp_id,
             w.name as ward_name, tc.name as category_name, tc.color as category_color,
             ROUND((julianday('now') - julianday(t.due_date)) * 24, 1) as hours_overdue
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      JOIN wards w ON t.ward_id = w.id
      JOIN task_categories tc ON t.category_id = tc.id
      WHERE t.status NOT IN ('Completed', 'Cancelled')
        AND datetime(t.due_date) < datetime('now')
    `;
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      query += ` AND t.ward_id = ?`;
      params.push(wardId);
    }

    query += ` ORDER BY t.due_date ASC`;

    const overdueTasks = db.prepare(query).all(...params);
    return res.json(overdueTasks);
  } catch (err) {
    console.error('getOverdueTasksReport error:', err);
    return res.status(500).json({ error: 'Failed to generate overdue tasks report' });
  }
}

export function getInventoryAlertsReport(req: AuthenticatedRequest, res: Response) {
  try {
    const lowStockItems = db.prepare(`
      SELECT i.id, i.code, i.name, i.category, i.unit, i.min_stock,
             COALESCE(SUM(b.quantity), 0) as current_stock,
             s.name as supplier_name, w.name as ward_name
      FROM inventory_items i
      LEFT JOIN inventory_batches b ON i.id = b.item_id AND b.quantity > 0 AND b.expiry_date >= date('now')
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN wards w ON i.ward_id = w.id
      GROUP BY i.id
      HAVING current_stock <= i.min_stock
      ORDER BY (i.min_stock - current_stock) DESC
    `).all();

    const nearExpiryBatches = db.prepare(`
      SELECT b.id, b.batch_number, b.quantity, b.expiry_date, b.location_bin,
             i.name as item_name, i.code as item_code, i.category, i.unit,
             ROUND(julianday(b.expiry_date) - julianday('now')) as days_to_expiry
      FROM inventory_batches b
      JOIN inventory_items i ON b.item_id = i.id
      WHERE b.quantity > 0
        AND b.expiry_date >= date('now')
        AND b.expiry_date <= date('now', '+60 days')
      ORDER BY b.expiry_date ASC
    `).all();

    const expiredBatches = db.prepare(`
      SELECT b.id, b.batch_number, b.quantity, b.expiry_date, b.location_bin,
             i.name as item_name, i.code as item_code, i.category, i.unit,
             ROUND(julianday('now') - julianday(b.expiry_date)) as days_expired
      FROM inventory_batches b
      JOIN inventory_items i ON b.item_id = i.id
      WHERE b.quantity > 0
        AND b.expiry_date < date('now')
      ORDER BY b.expiry_date ASC
    `).all();

    return res.json({
      lowStockItems,
      nearExpiryBatches,
      expiredBatches
    });
  } catch (err) {
    console.error('getInventoryAlertsReport error:', err);
    return res.status(500).json({ error: 'Failed to generate inventory alerts report' });
  }
}

export function getStockMovementReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, wardId } = req.query;

    let query = `
      SELECT t.type, COUNT(t.id) as transaction_count, SUM(t.quantity) as total_quantity
      FROM inventory_transactions t
      WHERE 1=1
    `;
    const params: any[] = [];

    if (wardId && wardId !== 'ALL') {
      query += ` AND t.ward_id = ?`;
      params.push(wardId);
    }

    query += ` GROUP BY t.type`;

    const summaryByType = db.prepare(query).all(...params);

    const recentMovements = db.prepare(`
      SELECT t.*, i.name as item_name, i.code as item_code, i.unit,
             u.name as staff_name, w.name as ward_name, b.batch_number
      FROM inventory_transactions t
      JOIN inventory_items i ON t.item_id = i.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN wards w ON t.ward_id = w.id
      LEFT JOIN inventory_batches b ON t.batch_id = b.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `).all();

    return res.json({
      summaryByType,
      recentMovements
    });
  } catch (err) {
    console.error('getStockMovementReport error:', err);
    return res.status(500).json({ error: 'Failed to generate stock movement report' });
  }
}
