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
