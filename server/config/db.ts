import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'nurseflow.db');

export const db = new Database(DB_PATH, {
  // verbose: console.log 
});

// Enforce foreign key constraints and WAL mode for high performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Wards
    CREATE TABLE IF NOT EXISTS wards (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL REFERENCES departments(id),
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      floor TEXT,
      bed_capacity INTEGER DEFAULT 20,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Roles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id TEXT NOT NULL REFERENCES roles(id),
      department_id TEXT REFERENCES departments(id),
      ward_id TEXT REFERENCES wards(id),
      phone TEXT,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Staff Profiles
    CREATE TABLE IF NOT EXISTS staff_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      qualification TEXT,
      registration_no TEXT,
      date_of_joining TEXT,
      emergency_contact TEXT
    );

    -- Shifts
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Shift Assignments
    CREATE TABLE IF NOT EXISTS shift_assignments (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL REFERENCES shifts(id),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ward_id TEXT NOT NULL REFERENCES wards(id),
      date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, ON_DUTY, COMPLETED, ABSENT, SWAPPED
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Staff Availability
    CREATE TABLE IF NOT EXISTS staff_availability (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, ON_LEAVE, SICK, OFF_DUTY
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Patients (Synthetic Inpatient Census for Workflows)
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      uhid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL, -- Male, Female, Other
      ward_id TEXT NOT NULL REFERENCES wards(id),
      bed_number TEXT NOT NULL,
      admission_date TEXT NOT NULL,
      diagnosis TEXT,
      attending_doctor TEXT,
      status TEXT DEFAULT 'ADMITTED', -- ADMITTED, DISCHARGED, TRANSFERRED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Task Categories
    CREATE TABLE IF NOT EXISTS task_categories (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT 'teal',
      icon TEXT DEFAULT 'CheckSquare',
      description TEXT
    );

    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT NOT NULL REFERENCES task_categories(id),
      ward_id TEXT NOT NULL REFERENCES wards(id),
      assigned_to TEXT NOT NULL REFERENCES users(id),
      created_by TEXT NOT NULL REFERENCES users(id),
      priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Urgent
      status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed, Cancelled
      due_date TEXT NOT NULL, -- ISO string or YYYY-MM-DD HH:mm
      recurrence TEXT DEFAULT 'NONE', -- NONE, DAILY, EVERY_SHIFT, WEEKLY
      patient_reference TEXT,
      instructions TEXT,
      completion_notes TEXT,
      completed_at DATETIME,
      completed_by TEXT REFERENCES users(id),
      escalated INTEGER DEFAULT 0,
      escalated_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Task Comments
    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Task History
    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Register Templates
    CREATE TABLE IF NOT EXISTS register_templates (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      fields_schema TEXT NOT NULL, -- JSON
      active INTEGER DEFAULT 1
    );

    -- Register Entries
    CREATE TABLE IF NOT EXISTS register_entries (
      id TEXT PRIMARY KEY,
      register_code TEXT NOT NULL,
      ward_id TEXT NOT NULL REFERENCES wards(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      data_json TEXT NOT NULL,
      status TEXT DEFAULT 'FINAL', -- DRAFT, FINAL, AMENDED
      current_version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Register Entry History (For corrections & versioning, preserving original)
    CREATE TABLE IF NOT EXISTS register_entry_history (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL REFERENCES register_entries(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      data_json TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      lead_time_days INTEGER DEFAULT 3
    );

    -- Inventory Items
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- Consumables, Pharmaceuticals, Equipment, Surgical, PPE
      unit TEXT NOT NULL, -- Pieces, Boxes, Vials, Ampoules, Bottles, Packs
      min_stock INTEGER DEFAULT 10,
      ward_id TEXT REFERENCES wards(id),
      supplier_id TEXT REFERENCES suppliers(id),
      cost_per_unit REAL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Inventory Batches
    CREATE TABLE IF NOT EXISTS inventory_batches (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      initial_quantity INTEGER NOT NULL,
      expiry_date TEXT NOT NULL, -- YYYY-MM-DD
      purchase_date TEXT,
      cost_per_unit REAL,
      location_bin TEXT,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, LOW, EXPIRED, QUARANTINED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Inventory Transactions
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES inventory_items(id),
      batch_id TEXT REFERENCES inventory_batches(id),
      type TEXT NOT NULL, -- RECEIVED, ISSUED, RETURNED, ADJUSTED
      quantity INTEGER NOT NULL,
      source TEXT,
      destination TEXT,
      reason TEXT,
      ward_id TEXT REFERENCES wards(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ward Inventory
    CREATE TABLE IF NOT EXISTS ward_inventory (
      id TEXT PRIMARY KEY,
      ward_id TEXT NOT NULL REFERENCES wards(id),
      item_id TEXT NOT NULL REFERENCES inventory_items(id),
      quantity INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ward_id, item_id)
    );

    -- Stock Requests
    CREATE TABLE IF NOT EXISTS stock_requests (
      id TEXT PRIMARY KEY,
      request_no TEXT UNIQUE NOT NULL,
      ward_id TEXT NOT NULL REFERENCES wards(id),
      requested_by TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'Pending', -- Pending, Approved, Partially Approved, Rejected, Fulfilled
      urgency TEXT DEFAULT 'Normal', -- Routine, Urgent, Emergency
      notes TEXT,
      reviewed_by TEXT REFERENCES users(id),
      review_comment TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Stock Request Items
    CREATE TABLE IF NOT EXISTS stock_request_items (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES stock_requests(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES inventory_items(id),
      quantity_requested INTEGER NOT NULL,
      quantity_approved INTEGER DEFAULT 0,
      notes TEXT
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- TASK, SHIFT, HANDOVER, INVENTORY, SYSTEM, ESCALATION
      priority TEXT DEFAULT 'Normal', -- Normal, High, Urgent
      link TEXT,
      is_read INTEGER DEFAULT 0,
      is_acknowledged INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notification Preferences
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email_alerts INTEGER DEFAULT 1,
      task_deadlines INTEGER DEFAULT 1,
      handover_reminders INTEGER DEFAULT 1,
      stock_alerts INTEGER DEFAULT 1
    );

    -- Handovers
    CREATE TABLE IF NOT EXISTS handovers (
      id TEXT PRIMARY KEY,
      ward_id TEXT NOT NULL REFERENCES wards(id),
      shift_id TEXT NOT NULL REFERENCES shifts(id),
      date TEXT NOT NULL, -- YYYY-MM-DD
      outgoing_nurse_id TEXT NOT NULL REFERENCES users(id),
      incoming_nurse_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'PENDING_ACKNOWLEDGEMENT', -- DRAFT, PENDING_ACKNOWLEDGEMENT, ACKNOWLEDGED, INCOMPLETE
      notes TEXT,
      equipment_issues TEXT,
      unresolved_incidents TEXT,
      pending_task_ids TEXT, -- JSON array of task ids
      completed_at DATETIME,
      acknowledged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Handover Notes
    CREATE TABLE IF NOT EXISTS handover_notes (
      id TEXT PRIMARY KEY,
      handover_id TEXT NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      note_type TEXT DEFAULT 'GENERAL', -- GENERAL, PATIENT_CARE, EQUIPMENT, INCIDENT
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Handover Tasks
    CREATE TABLE IF NOT EXISTS handover_tasks (
      id TEXT PRIMARY KEY,
      handover_id TEXT NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      status_at_handover TEXT
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      record_id TEXT,
      details TEXT, -- JSON or text describing changes
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_tasks_ward ON tasks(ward_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_register_entries_ward_code ON register_entries(ward_id, register_code);
    CREATE INDEX IF NOT EXISTS idx_inventory_items_ward ON inventory_items(ward_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_stock_requests_status ON stock_requests(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_shift_assignments_date_ward ON shift_assignments(date, ward_id);
    CREATE INDEX IF NOT EXISTS idx_handovers_date_ward ON handovers(date, ward_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_patients_ward ON patients(ward_id);
    CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
  `);
  console.log('Database initialized successfully with complete relational schema.');
}
