import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyRole } from '../services/notificationService.js';

export function getStockRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, wardId, urgency } = req.query;

    let query = `
      SELECT sr.*, w.name as ward_name, u_req.name as requested_by_name, u_req.employee_id as requested_by_emp_id,
             u_rev.name as reviewed_by_name,
             COUNT(sri.id) as item_count,
             COALESCE(SUM(sri.quantity_requested), 0) as total_units_requested
      FROM stock_requests sr
      JOIN wards w ON sr.ward_id = w.id
      JOIN users u_req ON sr.requested_by = u_req.id
      LEFT JOIN users u_rev ON sr.reviewed_by = u_rev.id
      LEFT JOIN stock_request_items sri ON sr.id = sri.request_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` AND sr.status = ?`;
      params.push(status);
    }
    if (wardId && wardId !== 'ALL') {
      query += ` AND sr.ward_id = ?`;
      params.push(wardId);
    }
    if (urgency && urgency !== 'ALL') {
      query += ` AND sr.urgency = ?`;
      params.push(urgency);
    }

    query += ` GROUP BY sr.id ORDER BY CASE sr.status WHEN 'Pending' THEN 1 ELSE 2 END, sr.created_at DESC`;

    const requests = db.prepare(query).all(...params);
    return res.json(requests);
  } catch (err) {
    console.error('getStockRequests error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock requests' });
  }
}

export function getStockRequestById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const request = db.prepare(`
      SELECT sr.*, w.name as ward_name,
             u_req.name as requested_by_name, u_req.employee_id as requested_by_emp_id,
             u_rev.name as reviewed_by_name
      FROM stock_requests sr
      JOIN wards w ON sr.ward_id = w.id
      JOIN users u_req ON sr.requested_by = u_req.id
      LEFT JOIN users u_rev ON sr.reviewed_by = u_rev.id
      WHERE sr.id = ?
    `).get(id) as any;

    if (!request) {
      return res.status(404).json({ error: 'Stock request not found' });
    }

    const items = db.prepare(`
      SELECT sri.*, i.name as item_name, i.code as item_code, i.unit,
             COALESCE((SELECT SUM(quantity) FROM inventory_batches WHERE item_id = i.id AND quantity > 0), 0) as available_store_stock
      FROM stock_request_items sri
      JOIN inventory_items i ON sri.item_id = i.id
      WHERE sri.request_id = ?
    `).all(id);

    return res.json({
      ...request,
      items
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch request details' });
  }
}

export function createStockRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { wardId, urgency = 'Normal', notes, items } = req.body;

    if (!wardId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Target ward and at least one stock item are required.' });
    }

    const requestId = crypto.randomUUID();
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM stock_requests`).get() as any;
    const requestNo = `REQ-2026-${String((countRow?.count || 0) + 1).padStart(4, '0')}`;

    db.prepare(`
      INSERT INTO stock_requests (
        id, request_no, ward_id, requested_by, status, urgency, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(requestId, requestNo, wardId, req.user.id, urgency, notes || null);

    const insertItemStmt = db.prepare(`
      INSERT INTO stock_request_items (id, request_id, item_id, quantity_requested, quantity_approved, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const qty = parseInt(item.quantityRequested, 10);
      if (item.itemId && !isNaN(qty) && qty > 0) {
        insertItemStmt.run(crypto.randomUUID(), requestId, item.itemId, qty, 0, item.notes || null);
      }
    }

    notifyRole('Inventory Manager', {
      title: `${urgency === 'Emergency' ? '🚨 EMERGENCY ' : ''}New Ward Stock Request`,
      message: `Ward stock request ${requestNo} submitted (${items.length} item line${items.length > 1 ? 's' : ''}). Urgency: ${urgency}`,
      type: 'INVENTORY',
      priority: urgency === 'Emergency' ? 'Urgent' : urgency === 'Urgent' ? 'High' : 'Normal',
      link: `/inventory/requests`
    });

    logAudit({
      userId: req.user.id,
      action: 'STOCK_REQUEST_CREATE',
      entity: 'STOCK_REQUEST',
      recordId: requestId,
      details: { requestNo, wardId, urgency, itemCount: items.length },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id: requestId, requestNo, message: `Stock request ${requestNo} submitted.` });
  } catch (err) {
    console.error('createStockRequest error:', err);
    return res.status(500).json({ error: 'Failed to create stock request' });
  }
}

export function reviewStockRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { status, reviewComment, approvedItems } = req.body;

    if (!['Approved', 'Partially Approved', 'Rejected', 'Fulfilled'].includes(status)) {
      return res.status(400).json({ error: 'Valid review status is required.' });
    }

    const request = db.prepare(`SELECT * FROM stock_requests WHERE id = ?`).get(id) as any;
    if (!request) return res.status(404).json({ error: 'Stock request not found' });

    db.prepare(`
      UPDATE stock_requests SET
        status = ?,
        reviewed_by = ?,
        review_comment = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.id, reviewComment || null, id);

    if (Array.isArray(approvedItems)) {
      const updateItemStmt = db.prepare(`
        UPDATE stock_request_items SET quantity_approved = ? WHERE id = ?
      `);
      for (const item of approvedItems) {
        updateItemStmt.run(parseInt(item.quantityApproved, 10) || 0, item.id);
      }
    } else if (status === 'Approved') {
      // Approve all requested quantities by default
      db.prepare(`
        UPDATE stock_request_items SET quantity_approved = quantity_requested WHERE request_id = ?
      `).run(id);
    }

    createNotification({
      userId: request.requested_by,
      title: `Stock Request ${request.request_no} ${status}`,
      message: `Your stock requisition has been marked ${status}.${reviewComment ? ` Note: "${reviewComment}"` : ''}`,
      type: 'INVENTORY',
      priority: status === 'Approved' ? 'Normal' : 'High',
      link: `/inventory/requests`
    });

    logAudit({
      userId: req.user.id,
      action: 'STOCK_REQUEST_REVIEW',
      entity: 'STOCK_REQUEST',
      recordId: id,
      details: { status, reviewComment },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Request ${request.request_no} has been updated to ${status}` });
  } catch (err) {
    console.error('reviewStockRequest error:', err);
    return res.status(500).json({ error: 'Failed to review stock request' });
  }
}
