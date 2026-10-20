import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyRole } from '../services/notificationService.js';

export function getInventoryMetrics(req: AuthenticatedRequest, res: Response) {
  try {
    const totalItems = db.prepare(`SELECT COUNT(*) as count FROM inventory_items`).get() as any;

    const lowStock = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT i.id, i.min_stock, COALESCE(SUM(b.quantity), 0) as current_stock
        FROM inventory_items i
        LEFT JOIN inventory_batches b ON i.id = b.item_id AND b.quantity > 0 AND b.expiry_date >= date('now')
        GROUP BY i.id
        HAVING current_stock <= i.min_stock
      )
    `).get() as any;

    const nearExpiry = db.prepare(`
      SELECT COUNT(*) as count FROM inventory_batches
      WHERE quantity > 0
        AND expiry_date >= date('now')
        AND expiry_date <= date('now', '+60 days')
    `).get() as any;

    const expiredBatches = db.prepare(`
      SELECT COUNT(*) as count FROM inventory_batches
      WHERE quantity > 0 AND expiry_date < date('now')
    `).get() as any;

    const pendingRequests = db.prepare(`
      SELECT COUNT(*) as count FROM stock_requests WHERE status = 'Pending'
    `).get() as any;

    return res.json({
      totalItems: totalItems?.count || 0,
      lowStockCount: lowStock?.count || 0,
      nearExpiryCount: nearExpiry?.count || 0,
      expiredCount: expiredBatches?.count || 0,
      pendingRequestsCount: pendingRequests?.count || 0,
    });
  } catch (err) {
    console.error('getInventoryMetrics error:', err);
    return res.status(500).json({ error: 'Failed to fetch inventory metrics' });
  }
}

export function getInventoryItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { category, wardId, status, search } = req.query;

    let query = `
      SELECT i.*, s.name as supplier_name, w.name as ward_name,
             COALESCE(SUM(b.quantity), 0) as current_stock,
             COUNT(DISTINCT b.id) as active_batch_count,
             MIN(CASE WHEN b.quantity > 0 THEN b.expiry_date ELSE NULL END) as earliest_expiry
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN wards w ON i.ward_id = w.id
      LEFT JOIN inventory_batches b ON i.id = b.item_id AND b.quantity > 0
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ` AND i.category = ?`;
      params.push(category);
    }
    if (wardId && wardId !== 'ALL') {
      query += ` AND i.ward_id = ?`;
      params.push(wardId);
    }
    if (search) {
      query += ` AND (i.name LIKE ? OR i.code LIKE ? OR i.category LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` GROUP BY i.id`;

    if (status === 'LOW_STOCK') {
      query += ` HAVING current_stock <= i.min_stock`;
    } else if (status === 'NEAR_EXPIRY') {
      query += ` HAVING earliest_expiry <= date('now', '+60 days') AND earliest_expiry >= date('now')`;
    } else if (status === 'EXPIRED') {
      query += ` HAVING earliest_expiry < date('now')`;
    }

    query += ` ORDER BY i.name ASC`;

    const items = db.prepare(query).all(...params);
    return res.json(items);
  } catch (err) {
    console.error('getInventoryItems error:', err);
    return res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
}

export function getItemById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const item = db.prepare(`
      SELECT i.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone,
             w.name as ward_name,
             COALESCE(SUM(b.quantity), 0) as current_stock
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN wards w ON i.ward_id = w.id
      LEFT JOIN inventory_batches b ON i.id = b.item_id AND b.quantity > 0
      WHERE i.id = ?
      GROUP BY i.id
    `).get(id) as any;

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const batches = db.prepare(`
      SELECT * FROM inventory_batches
      WHERE item_id = ?
      ORDER BY expiry_date ASC
    `).all(id);

    const transactions = db.prepare(`
      SELECT t.*, u.name as staff_name, u.employee_id as staff_emp_id,
             b.batch_number, w.name as ward_name
      FROM inventory_transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN inventory_batches b ON t.batch_id = b.id
      LEFT JOIN wards w ON t.ward_id = w.id
      WHERE t.item_id = ?
      ORDER BY t.created_at DESC
      LIMIT 50
    `).all(id);

    return res.json({
      ...item,
      batches,
      transactions
    });
  } catch (err) {
    console.error('getItemById error:', err);
    return res.status(500).json({ error: 'Failed to fetch item details' });
  }
}

export function addItem(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { code, name, category, unit, minStock, wardId, supplierId, costPerUnit, description } = req.body;

    if (!code || !name || !category || !unit) {
      return res.status(400).json({ error: 'Code, name, category, and unit are required' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO inventory_items (id, code, name, category, unit, min_stock, ward_id, supplier_id, cost_per_unit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      code.trim().toUpperCase(),
      name.trim(),
      category,
      unit,
      minStock || 10,
      wardId || null,
      supplierId || null,
      costPerUnit || 0,
      description || null
    );

    logAudit({
      userId: req.user.id,
      action: 'INVENTORY_ITEM_CREATE',
      entity: 'INVENTORY',
      recordId: id,
      details: { code, name, category },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ id, message: 'Inventory item created successfully' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Item code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create inventory item' });
  }
}

export function receiveStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { itemId, batchNumber, quantity, expiryDate, purchaseDate, costPerUnit, locationBin, source, notes } = req.body;

    const qty = parseInt(quantity, 10);
    if (!itemId || !batchNumber || isNaN(qty) || qty <= 0 || !expiryDate) {
      return res.status(400).json({ error: 'Item, batch number, positive quantity, and expiry date are required.' });
    }

    const item = db.prepare(`SELECT * FROM inventory_items WHERE id = ?`).get(itemId) as any;
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const batchId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();

    // 1. Create batch record
    db.prepare(`
      INSERT INTO inventory_batches (
        id, item_id, batch_number, quantity, initial_quantity, expiry_date, purchase_date, cost_per_unit, location_bin, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      batchId,
      itemId,
      batchNumber.trim().toUpperCase(),
      qty,
      qty,
      expiryDate,
      purchaseDate || new Date().toISOString().split('T')[0],
      costPerUnit || item.cost_per_unit || 0,
      locationBin || 'Central Pharmacy'
    );

    // 2. Record transaction
    db.prepare(`
      INSERT INTO inventory_transactions (
        id, item_id, batch_id, type, quantity, source, destination, reason, user_id
      ) VALUES (?, ?, ?, 'RECEIVED', ?, ?, 'Central Store', ?, ?)
    `).run(
      transactionId,
      itemId,
      batchId,
      qty,
      source || 'Central Medical Supplies Vendor',
      notes || 'Stock consignment receipt',
      req.user.id
    );

    logAudit({
      userId: req.user.id,
      action: 'STOCK_RECEIVED',
      entity: 'INVENTORY_TRANSACTION',
      recordId: transactionId,
      details: { item: item.name, batchNumber, quantity: qty, expiryDate },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ message: `Successfully received ${qty} ${item.unit} into batch ${batchNumber}` });
  } catch (err) {
    console.error('receiveStock error:', err);
    return res.status(500).json({ error: 'Failed to record stock receipt' });
  }
}

export function issueStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { itemId, batchId, quantity, wardId, reason } = req.body;

    const qty = parseInt(quantity, 10);
    if (!itemId || !batchId || isNaN(qty) || qty <= 0 || !wardId) {
      return res.status(400).json({ error: 'Item, batch, quantity, and target ward are required.' });
    }

    const batch = db.prepare(`SELECT * FROM inventory_batches WHERE id = ? AND item_id = ?`).get(batchId, itemId) as any;
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (batch.quantity < qty) {
      return res.status(400).json({ error: `Insufficient stock in batch. Available: ${batch.quantity}, Requested: ${qty}` });
    }

    const item = db.prepare(`SELECT * FROM inventory_items WHERE id = ?`).get(itemId) as any;
    const ward = db.prepare(`SELECT * FROM wards WHERE id = ?`).get(wardId) as any;

    // 1. Decrement batch quantity
    const newBatchQty = batch.quantity - qty;
    db.prepare(`UPDATE inventory_batches SET quantity = ? WHERE id = ?`).run(newBatchQty, batchId);

    // 2. Increment ward inventory
    db.prepare(`
      INSERT INTO ward_inventory (id, ward_id, item_id, quantity, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(ward_id, item_id) DO UPDATE SET
        quantity = ward_inventory.quantity + excluded.quantity,
        updated_at = CURRENT_TIMESTAMP
    `).run(crypto.randomUUID(), wardId, itemId, qty);

    // 3. Record transaction
    const transactionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO inventory_transactions (
        id, item_id, batch_id, type, quantity, source, destination, reason, ward_id, user_id
      ) VALUES (?, ?, ?, 'ISSUED', ?, 'Central Store', ?, ?, ?, ?)
    `).run(
      transactionId,
      itemId,
      batchId,
      qty,
      ward?.name || 'Clinical Ward',
      reason || 'Ward stock replenishment',
      wardId,
      req.user.id
    );

    logAudit({
      userId: req.user.id,
      action: 'STOCK_ISSUED',
      entity: 'INVENTORY_TRANSACTION',
      recordId: transactionId,
      details: { item: item.name, batch: batch.batch_number, quantity: qty, ward: ward?.name },
      ipAddress: req.ip || '127.0.0.1'
    });

    // Check remaining total stock against minStock
    const totalRemaining = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total FROM inventory_batches WHERE item_id = ? AND quantity > 0
    `).get(itemId) as any;

    if (totalRemaining.total <= item.min_stock) {
      notifyRole('Inventory Manager', {
        title: 'Low Stock Alert',
        message: `${item.name} (${item.code}) is below threshold (${totalRemaining.total} ${item.unit} remaining, Min: ${item.min_stock})`,
        type: 'INVENTORY',
        priority: 'High',
        link: `/inventory/${itemId}`
      });
    }

    return res.json({ message: `Issued ${qty} ${item.unit} to ${ward?.name}` });
  } catch (err) {
    console.error('issueStock error:', err);
    return res.status(500).json({ error: 'Failed to issue stock' });
  }
}

export function returnStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { itemId, batchId, quantity, wardId, reason } = req.body;

    const qty = parseInt(quantity, 10);
    if (!itemId || !batchId || isNaN(qty) || qty <= 0 || !wardId) {
      return res.status(400).json({ error: 'Item, batch, quantity, and ward are required.' });
    }

    const batch = db.prepare(`SELECT * FROM inventory_batches WHERE id = ?`).get(batchId) as any;
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    // Decrement ward inventory
    db.prepare(`
      UPDATE ward_inventory SET quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP
      WHERE ward_id = ? AND item_id = ?
    `).run(qty, wardId, itemId);

    // Increment batch
    db.prepare(`UPDATE inventory_batches SET quantity = quantity + ? WHERE id = ?`).run(qty, batchId);

    const transactionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO inventory_transactions (
        id, item_id, batch_id, type, quantity, source, destination, reason, ward_id, user_id
      ) VALUES (?, ?, ?, 'RETURNED', ?, 'Ward Store', 'Central Store', ?, ?, ?)
    `).run(
      transactionId,
      itemId,
      batchId,
      qty,
      reason || 'Surplus stock returned to central inventory',
      wardId,
      req.user.id
    );

    logAudit({
      userId: req.user.id,
      action: 'STOCK_RETURNED',
      entity: 'INVENTORY_TRANSACTION',
      recordId: transactionId,
      details: { itemId, batchId, quantity: qty, wardId, reason },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Successfully returned ${qty} items to batch ${batch.batch_number}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to return stock' });
  }
}

export function adjustStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { itemId, batchId, newQuantity, reason } = req.body;

    const newQty = parseInt(newQuantity, 10);
    if (!batchId || isNaN(newQty) || newQty < 0 || !reason) {
      return res.status(400).json({ error: 'Batch, valid target quantity, and clinical reconciliation reason are required.' });
    }

    const batch = db.prepare(`SELECT * FROM inventory_batches WHERE id = ?`).get(batchId) as any;
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const diff = newQty - batch.quantity;

    db.prepare(`UPDATE inventory_batches SET quantity = ? WHERE id = ?`).run(newQty, batchId);

    const transactionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO inventory_transactions (
        id, item_id, batch_id, type, quantity, source, destination, reason, user_id
      ) VALUES (?, ?, ?, 'ADJUSTED', ?, 'Audit Count', 'Physical Shelf', ?, ?)
    `).run(
      transactionId,
      batch.item_id,
      batchId,
      diff,
      `Adjustment (${diff > 0 ? '+' : ''}${diff}): ${reason}`,
      req.user.id
    );

    logAudit({
      userId: req.user.id,
      action: 'STOCK_ADJUSTMENT',
      entity: 'INVENTORY_BATCH',
      recordId: batchId,
      details: { previousQty: batch.quantity, newQty, diff, reason },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Batch ${batch.batch_number} stock adjusted to ${newQty}. Variance: ${diff}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to adjust stock' });
  }
}

export function getTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const { type, wardId, itemId, limit = 100 } = req.query;

    let query = `
      SELECT t.*, u.name as staff_name, u.employee_id as staff_emp_id,
             i.name as item_name, i.code as item_code, i.unit,
             b.batch_number, w.name as ward_name
      FROM inventory_transactions t
      JOIN users u ON t.user_id = u.id
      JOIN inventory_items i ON t.item_id = i.id
      LEFT JOIN inventory_batches b ON t.batch_id = b.id
      LEFT JOIN wards w ON t.ward_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && type !== 'ALL') {
      query += ` AND t.type = ?`;
      params.push(type);
    }
    if (wardId && wardId !== 'ALL') {
      query += ` AND t.ward_id = ?`;
      params.push(wardId);
    }
    if (itemId && itemId !== 'ALL') {
      query += ` AND t.item_id = ?`;
      params.push(itemId);
    }

    query += ` ORDER BY t.created_at DESC LIMIT ?`;
    params.push(parseInt(String(limit), 10));

    const transactions = db.prepare(query).all(...params);
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch transaction ledger' });
  }
}
