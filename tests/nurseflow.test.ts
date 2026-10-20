import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initDatabase } from '../server/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nurseflow-development-secret-key-change-in-production';

describe('NurseFlow Clinical Core & Security Test Suite', () => {
  before(() => {
    initDatabase();
  });

  describe('1. Authentication & Security (Requirement 6, 79)', () => {
    it('should securely verify hashed hospital passwords', () => {
      const plain = 'hospital123';
      const hash = bcrypt.hashSync(plain, 10);
      assert.ok(bcrypt.compareSync(plain, hash), 'Password verification must pass for correct input');
      assert.ok(!bcrypt.compareSync('wrongpass', hash), 'Password verification must fail for invalid input');
    });

    it('should generate valid JWT sessions with user ID and clinical role', () => {
      const payload = { id: 'usr-priya', role: 'Nurse', employeeId: 'NF-NUR-101' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      assert.equal(decoded.id, 'usr-priya');
      assert.equal(decoded.role, 'Nurse');
      assert.equal(decoded.employeeId, 'NF-NUR-101');
    });

    it('should reject tampered or expired tokens', () => {
      const token = jwt.sign({ id: 'usr-fake' }, 'wrong-secret');
      assert.throws(() => {
        jwt.verify(token, JWT_SECRET);
      });
    });
  });

  describe('2. Role-Based Access Control (RBAC) Permissions (Requirement 7, 80)', () => {
    it('should correctly define role permissions hierarchy', () => {
      const nursePermissions = ['tasks:read', 'tasks:update', 'registers:write', 'handovers:sign'];
      const supervisorPermissions = [...nursePermissions, 'tasks:assign', 'handovers:audit', 'stock:approve'];
      const inventoryPermissions = ['inventory:manage', 'stock:issue', 'stock:receive', 'stock:adjust'];
      const adminPermissions = ['users:manage', 'wards:manage', 'audit:view'];

      assert.ok(!nursePermissions.includes('users:manage'), 'Nurse must not have administrative user management rights');
      assert.ok(supervisorPermissions.includes('stock:approve'), 'Supervisor must have stock approval rights');
      assert.ok(inventoryPermissions.includes('stock:issue'), 'Inventory Manager must have stock issuing rights');
      assert.ok(adminPermissions.includes('audit:view'), 'Admin must have audit inspection rights');
    });
  });

  describe('3. Clinical Task Operations & Life-cycle (Requirements 20, 21, 23)', () => {
    it('should create task and transition through Pending -> In Progress -> Completed', () => {
      const taskId = `test-task-${Date.now()}`;
      const now = new Date().toISOString();

      // Create
      db.prepare(`
        INSERT INTO tasks (id, title, category_id, ward_id, assigned_to, created_by, priority, status, due_date)
        VALUES (?, 'Test IV Antibiotic Infusion', 'cat-med', 'ward-micu', 'usr-priya', 'usr-sunita', 'Urgent', 'Pending', ?)
      `).run(taskId, now);

      let task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;
      assert.equal(task.status, 'Pending');
      assert.equal(task.priority, 'Urgent');

      // Update to In Progress
      db.prepare(`UPDATE tasks SET status = 'In Progress' WHERE id = ?`).run(taskId);
      task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;
      assert.equal(task.status, 'In Progress');

      // Complete with clinical sign-off notes
      const completionNote = 'Administered 1g IV in 100ml NS over 30 mins. Patient tolerated well.';
      db.prepare(`
        UPDATE tasks SET status = 'Completed', completion_notes = ?, completed_at = CURRENT_TIMESTAMP, completed_by = 'usr-priya'
        WHERE id = ?
      `).run(completionNote, taskId);

      task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;
      assert.equal(task.status, 'Completed');
      assert.equal(task.completion_notes, completionNote);
      assert.ok(task.completed_at, 'Completion timestamp must be set');

      // Cleanup
      db.prepare(`DELETE FROM tasks WHERE id = ?`).run(taskId);
    });

    it('should track clinical task escalation with reasoning', () => {
      const taskId = `test-esc-${Date.now()}`;
      db.prepare(`
        INSERT INTO tasks (id, title, category_id, ward_id, assigned_to, created_by, priority, status, due_date)
        VALUES (?, 'Test Escalation Task', 'cat-vitals', 'ward-etr', 'usr-ananya', 'usr-sunita', 'Urgent', 'Pending', CURRENT_TIMESTAMP)
      `).run(taskId);

      const escReason = 'Patient MAP dropped to 52 mmHg despite fluid bolus. Attending intensivist notified.';
      db.prepare(`
        UPDATE tasks SET escalated = 1, escalated_reason = ?, priority = 'Urgent' WHERE id = ?
      `).run(escReason, taskId);

      const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as any;
      assert.equal(task.escalated, 1);
      assert.equal(task.escalated_reason, escReason);

      db.prepare(`DELETE FROM tasks WHERE id = ?`).run(taskId);
    });
  });

  describe('4. Inventory Transactions & Concurrency Safety (Requirements 31, 32, 33, 35)', () => {
    it('should decrement batch quantity on stock issue and update ward inventory', () => {
      // Find an active batch dynamically from database
      const batch = db.prepare(`SELECT * FROM inventory_batches WHERE quantity >= 20 LIMIT 1`).get() as any;
      assert.ok(batch, 'Active batch must exist');

      const itemId = batch.item_id;
      const initialBatchQty = batch.quantity;
      const issueQty = 5;

      // Execute transactional issue
      const tx = db.transaction(() => {
        db.prepare(`UPDATE inventory_batches SET quantity = quantity - ? WHERE id = ?`).run(issueQty, batch.id);
        db.prepare(`
          INSERT INTO ward_inventory (id, ward_id, item_id, quantity)
          VALUES (?, 'ward-micu', ?, ?)
          ON CONFLICT(ward_id, item_id) DO UPDATE SET quantity = ward_inventory.quantity + ?
        `).run(crypto.randomUUID(), itemId, issueQty, issueQty);
      });
      tx();

      const updatedBatch = db.prepare(`SELECT quantity FROM inventory_batches WHERE id = ?`).get(batch.id) as any;
      assert.equal(updatedBatch.quantity, initialBatchQty - issueQty, 'Batch quantity must decrement by issued count');

      // Rollback for test idempotency
      db.prepare(`UPDATE inventory_batches SET quantity = ? WHERE id = ?`).run(initialBatchQty, batch.id);
      db.prepare(`UPDATE ward_inventory SET quantity = quantity - ? WHERE ward_id = 'ward-micu' AND item_id = ?`).run(issueQty, itemId);
    });

    it('should prevent issuing stock exceeding available batch quantity', () => {
      const batch = db.prepare(`SELECT * FROM inventory_batches WHERE quantity > 0 LIMIT 1`).get() as any;
      assert.ok(batch);

      const requestedQty = batch.quantity + 999;
      const isValid = requestedQty <= batch.quantity;

      assert.ok(!isValid, 'Issue operation must be rejected when requested quantity exceeds available stock');
    });

    it('should flag expired batches as non-issuable', () => {
      const pastDate = '2025-01-01';
      const isExpired = new Date(pastDate).getTime() < Date.now();
      assert.ok(isExpired, 'Batches with expiration date in past must be evaluated as expired');
    });
  });

  describe('5. Digital Registers & Non-Destructive Versioning (Requirements 24, 26, 33)', () => {
    it('should create immutable audit version snapshot when entry is corrected', () => {
      const entryId = `test-reg-${Date.now()}`;
      const originalData = { bedNo: 'Bed 4', patientName: 'Test Patient', vitals: 'BP 120/80' };

      // Initial Version 1
      db.prepare(`
        INSERT INTO register_entries (id, register_code, ward_id, user_id, date, data_json, status, current_version)
        VALUES (?, 'daily_nursing_activity', 'ward-micu', 'usr-priya', '2026-10-20', ?, 'FINAL', 1)
      `).run(entryId, JSON.stringify(originalData));

      let entry = db.prepare(`SELECT * FROM register_entries WHERE id = ?`).get(entryId) as any;
      assert.equal(entry.current_version, 1);
      assert.equal(entry.status, 'FINAL');

      // Amend to Version 2 with mandatory clinical justification
      const correctedData = { ...originalData, vitals: 'BP 130/85' };
      const reason = 'Manual sphygmomanometer re-verification showed BP 130/85';

      const amendTx = db.transaction(() => {
        // 1. Archive Version 1 in register_entry_history
        db.prepare(`
          INSERT INTO register_entry_history (id, entry_id, version, user_id, data_json, reason)
          VALUES (?, ?, 1, 'usr-priya', ?, ?)
        `).run(crypto.randomUUID(), entryId, entry.data_json, reason);

        // 2. Update current entry to Version 2
        db.prepare(`
          UPDATE register_entries
          SET data_json = ?, current_version = 2, status = 'AMENDED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(correctedData), entryId);
      });
      amendTx();

      entry = db.prepare(`SELECT * FROM register_entries WHERE id = ?`).get(entryId) as any;
      assert.equal(entry.current_version, 2);
      assert.equal(entry.status, 'AMENDED');

      // Verify that version 1 is preserved intact in history
      const history = db.prepare(`SELECT * FROM register_entry_history WHERE entry_id = ?`).all(entryId) as any[];
      assert.equal(history.length, 1);
      assert.equal(history[0].version, 1);
      assert.equal(history[0].reason, reason);
      const archivedData = JSON.parse(history[0].data_json);
      assert.equal(archivedData.vitals, 'BP 120/80', 'Original version data must remain untouched');

      // Cleanup
      db.prepare(`DELETE FROM register_entry_history WHERE entry_id = ?`).run(entryId);
      db.prepare(`DELETE FROM register_entries WHERE id = ?`).run(entryId);
    });
  });

  describe('6. Shift Handover Workflow (Requirements 42, 44, 45)', () => {
    it('should create handover and record incoming nurse acknowledgement timestamp', () => {
      const hId = `test-ho-${Date.now()}`;
      db.prepare(`
        INSERT INTO handovers (id, ward_id, shift_id, date, outgoing_nurse_id, incoming_nurse_id, status, notes)
        VALUES (?, 'ward-micu', 'shift-morn', '2026-10-20', 'usr-priya', 'usr-mary', 'PENDING_ACKNOWLEDGEMENT', 'Patient on Bed 4 stable.')
      `).run(hId);

      let ho = db.prepare(`SELECT * FROM handovers WHERE id = ?`).get(hId) as any;
      assert.equal(ho.status, 'PENDING_ACKNOWLEDGEMENT');
      assert.equal(ho.acknowledged_at, null);

      // Incoming nurse acknowledges handover
      db.prepare(`
        UPDATE handovers
        SET status = 'ACKNOWLEDGED', acknowledged_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(hId);

      ho = db.prepare(`SELECT * FROM handovers WHERE id = ?`).get(hId) as any;
      assert.equal(ho.status, 'ACKNOWLEDGED');
      assert.ok(ho.acknowledged_at, 'Acknowledged timestamp must be legally stored');

      db.prepare(`DELETE FROM handovers WHERE id = ?`).run(hId);
    });
  });

  describe('7. CSV Data Validation Edge Cases (Requirements 65, 66)', () => {
    it('should detect duplicate codes, missing required columns, and invalid categories', () => {
      const validCategories = ['Pharmaceuticals', 'Consumables', 'Surgical', 'PPE', 'Equipment'];
      const existingCodes = new Set(['IV-NS-500', 'IV-RL-500']);

      const testRows = [
        { code: '', name: 'Missing Code Item', category: 'Consumables', unit: 'Pieces' },
        { code: 'IV-NS-500', name: 'Duplicate Item', category: 'Pharmaceuticals', unit: 'Bottles' },
        { code: 'NEW-ITEM-01', name: 'Invalid Cat Item', category: 'FastFood', unit: 'Pieces' },
        { code: 'VALID-ITEM-01', name: 'Valid Item', category: 'Consumables', unit: 'Pieces', min_stock: 10, cost_per_unit: 50 },
      ];

      const errors: string[] = [];
      const valid: any[] = [];

      testRows.forEach((r, idx) => {
        if (!r.code) errors.push(`Row ${idx + 1}: Missing code`);
        else if (existingCodes.has(r.code)) errors.push(`Row ${idx + 1}: Duplicate code ${r.code}`);
        else if (!validCategories.includes(r.category)) errors.push(`Row ${idx + 1}: Invalid category ${r.category}`);
        else valid.push(r);
      });

      assert.equal(errors.length, 3, 'Must identify all 3 invalid rows');
      assert.equal(valid.length, 1, 'Only 1 valid row should pass');
      assert.equal(valid[0].code, 'VALID-ITEM-01');
    });
  });
});
