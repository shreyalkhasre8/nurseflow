import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, initDatabase } from './config/db.js';

export function runSeed() {
  console.log('Initializing database schema for seeding...');
  initDatabase();

  // Clear existing tables in correct order
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM handover_notes;
    DELETE FROM handover_tasks;
    DELETE FROM handovers;
    DELETE FROM notifications;
    DELETE FROM stock_request_items;
    DELETE FROM stock_requests;
    DELETE FROM ward_inventory;
    DELETE FROM inventory_transactions;
    DELETE FROM inventory_batches;
    DELETE FROM inventory_items;
    DELETE FROM suppliers;
    DELETE FROM register_entry_history;
    DELETE FROM register_entries;
    DELETE FROM register_templates;
    DELETE FROM task_history;
    DELETE FROM task_comments;
    DELETE FROM tasks;
    DELETE FROM task_categories;
    DELETE FROM staff_availability;
    DELETE FROM shift_assignments;
    DELETE FROM shifts;
    DELETE FROM staff_profiles;
    DELETE FROM users;
    DELETE FROM roles;
    DELETE FROM wards;
    DELETE FROM departments;
  `);

  console.log('Seeding departments...');
  const deptStmt = db.prepare(`INSERT INTO departments (id, code, name, description) VALUES (?, ?, ?, ?)`);
  const depts = [
    { id: 'dept-icu', code: 'ICU', name: 'Intensive Care Unit', description: 'Critical care, hemodynamic monitoring and ventilator support' },
    { id: 'dept-genmed', code: 'GENMED', name: 'General Medicine', description: 'Adult internal medicine and inpatient acute care' },
    { id: 'dept-surg', code: 'SURG', name: 'General Surgery', description: 'Pre-operative and post-operative surgical inpatient care' },
    { id: 'dept-peds', code: 'PEDS', name: 'Pediatrics', description: 'Pediatric care and neonatal intermediate monitoring' },
    { id: 'dept-emrg', code: 'EMRG', name: 'Emergency & Trauma', description: '24/7 acute triage, resuscitation and emergency care' },
    { id: 'dept-ortho', code: 'ORTHO', name: 'Orthopedics', description: 'Musculoskeletal surgery and trauma post-op care' },
    { id: 'dept-admin', code: 'ADMIN', name: 'Hospital Administration', description: 'Operations, nursing governance and pharmacy supply chain' },
  ];
  for (const d of depts) {
    deptStmt.run(d.id, d.code, d.name, d.description);
  }

  console.log('Seeding clinical wards...');
  const wardStmt = db.prepare(`INSERT INTO wards (id, department_id, name, code, floor, bed_capacity) VALUES (?, ?, ?, ?, ?, ?)`);
  const wards = [
    { id: 'ward-micu', departmentId: 'dept-icu', name: 'Medical ICU (MICU)', code: 'MICU-01', floor: '3rd Floor - Block A', bedCapacity: 16 },
    { id: 'ward-sicu', departmentId: 'dept-icu', name: 'Surgical ICU (SICU)', code: 'SICU-02', floor: '3rd Floor - Block B', bedCapacity: 12 },
    { id: 'ward-mmw', departmentId: 'dept-genmed', name: 'Male Medical Ward', code: 'MMW-03', floor: '2nd Floor - Block A', bedCapacity: 28 },
    { id: 'ward-fmw', departmentId: 'dept-genmed', name: 'Female Medical Ward', code: 'FMW-04', floor: '2nd Floor - Block B', bedCapacity: 26 },
    { id: 'ward-fsw', departmentId: 'dept-surg', name: 'Female Surgical Ward', code: 'FSW-05', floor: '4th Floor - Block A', bedCapacity: 24 },
    { id: 'ward-msw', departmentId: 'dept-surg', name: 'Male Surgical Ward', code: 'MSW-06', floor: '4th Floor - Block B', bedCapacity: 24 },
    { id: 'ward-ped', departmentId: 'dept-peds', name: 'Pediatric Care Ward', code: 'PED-07', floor: '1st Floor - Block C', bedCapacity: 20 },
    { id: 'ward-etr', departmentId: 'dept-emrg', name: 'Emergency Triage & Resuscitation', code: 'ETR-08', floor: 'Ground Floor', bedCapacity: 18 },
    { id: 'ward-ortho', departmentId: 'dept-ortho', name: 'Orthopedic Post-Op Ward', code: 'OPOW-09', floor: '5th Floor - Block A', bedCapacity: 22 },
  ];
  for (const w of wards) {
    wardStmt.run(w.id, w.departmentId, w.name, w.code, w.floor, w.bedCapacity);
  }

  console.log('Seeding roles...');
  const roleStmt = db.prepare(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?)`);
  const roles = [
    { id: 'role-nurse', name: 'Nurse', description: 'Bedside nursing, tasks execution, registers, handovers, ward inventory' },
    { id: 'role-supervisor', name: 'Head Nurse / Supervisor', description: 'Clinical shift leadership, task assignment, workload monitoring, handover audit, stock approval' },
    { id: 'role-inventory', name: 'Inventory Manager', description: 'Pharmacy supply chain, batch tracking, stock issue, reconciliation, returns' },
    { id: 'role-admin', name: 'Administrator', description: 'System administration, user access, ward configuration, audit logs' },
  ];
  for (const r of roles) {
    roleStmt.run(r.id, r.name, r.description);
  }

  console.log('Seeding users & staff profiles...');
  const defaultPasswordHash = bcrypt.hashSync('hospital123', 10);
  const userStmt = db.prepare(`
    INSERT INTO users (id, employee_id, name, email, password_hash, role_id, department_id, ward_id, phone, status, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
  `);
  const profileStmt = db.prepare(`
    INSERT INTO staff_profiles (id, user_id, qualification, registration_no, date_of_joining, emergency_contact)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const users = [
    {
      id: 'usr-priya',
      employeeId: 'NF-NUR-101',
      name: 'Priya Sharma',
      email: 'priya.sharma@nurseflow.local',
      roleId: 'role-nurse',
      departmentId: 'dept-icu',
      wardId: 'ward-micu',
      phone: '+91 98451 23401',
      qualification: 'B.Sc. Nursing, Critical Care Certified',
      regNo: 'KNC-2018-98442',
      doj: '2021-04-12'
    },
    {
      id: 'usr-mary',
      employeeId: 'NF-NUR-102',
      name: 'Sister Mary Thomas',
      email: 'mary.thomas@nurseflow.local',
      roleId: 'role-nurse',
      departmentId: 'dept-surg',
      wardId: 'ward-fsw',
      phone: '+91 98451 23402',
      qualification: 'G.N.M, Post-Basic B.Sc.',
      regNo: 'KNC-2014-55120',
      doj: '2019-01-15'
    },
    {
      id: 'usr-ananya',
      employeeId: 'NF-NUR-103',
      name: 'Ananya Patel',
      email: 'ananya.patel@nurseflow.local',
      roleId: 'role-nurse',
      departmentId: 'dept-emrg',
      wardId: 'ward-etr',
      phone: '+91 98451 23403',
      qualification: 'B.Sc. Nursing, Trauma Life Support (ATLS)',
      regNo: 'GNC-2020-77319',
      doj: '2022-08-01'
    },
    {
      id: 'usr-deepa',
      employeeId: 'NF-NUR-104',
      name: 'Deepa Nair',
      email: 'deepa.nair@nurseflow.local',
      roleId: 'role-nurse',
      departmentId: 'dept-genmed',
      wardId: 'ward-mmw',
      phone: '+91 98451 23404',
      qualification: 'B.Sc. Nursing',
      regNo: 'TNC-2019-33129',
      doj: '2022-02-10'
    },
    {
      id: 'usr-sunita',
      employeeId: 'NF-SUP-201',
      name: 'Sunita Rao',
      email: 'sunita.rao@nurseflow.local',
      roleId: 'role-supervisor',
      departmentId: 'dept-icu',
      wardId: 'ward-micu',
      phone: '+91 98451 23410',
      qualification: 'M.Sc. Nursing, Clinical Nurse Specialist',
      regNo: 'KNC-2010-12001',
      doj: '2016-03-01'
    },
    {
      id: 'usr-sneha',
      employeeId: 'NF-SUP-202',
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@nurseflow.local',
      roleId: 'role-supervisor',
      departmentId: 'dept-surg',
      wardId: 'ward-fsw',
      phone: '+91 98451 23411',
      qualification: 'M.Sc. Surgical Nursing',
      regNo: 'MNC-2012-44102',
      doj: '2017-06-15'
    },
    {
      id: 'usr-rajesh',
      employeeId: 'NF-INV-301',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@nurseflow.local',
      roleId: 'role-inventory',
      departmentId: 'dept-admin',
      wardId: null,
      phone: '+91 98451 23420',
      qualification: 'B.Pharm, Certified Hospital Supply Chain',
      regNo: 'PCI-KA-2015-8812',
      doj: '2018-11-20'
    },
    {
      id: 'usr-admin',
      employeeId: 'NF-ADM-401',
      name: 'Dr. Ramesh Hegde',
      email: 'admin@nurseflow.local',
      roleId: 'role-admin',
      departmentId: 'dept-admin',
      wardId: null,
      phone: '+91 98451 23400',
      qualification: 'MHA, MBBS, Hospital Superintendent',
      regNo: 'KMC-2004-66321',
      doj: '2014-09-01'
    },
  ];

  for (const u of users) {
    userStmt.run(u.id, u.employeeId, u.name, u.email, defaultPasswordHash, u.roleId, u.departmentId, u.wardId, u.phone);
    profileStmt.run(crypto.randomUUID(), u.id, u.qualification, u.regNo, u.doj, '+91 98451 99999');
  }

  console.log('Seeding shift definitions...');
  const shiftStmt = db.prepare(`INSERT INTO shifts (id, name, code, start_time, end_time) VALUES (?, ?, ?, ?, ?)`);
  const shifts = [
    { id: 'shift-morn', name: 'Morning Shift', code: 'MORN', startTime: '07:00', endTime: '15:00' },
    { id: 'shift-eve', name: 'Evening Shift', code: 'EVE', startTime: '15:00', endTime: '23:00' },
    { id: 'shift-night', name: 'Night Shift', code: 'NIGHT', startTime: '23:00', endTime: '07:00' },
  ];
  for (const s of shifts) {
    shiftStmt.run(s.id, s.name, s.code, s.startTime, s.endTime);
  }

  console.log('Seeding task categories...');
  const catStmt = db.prepare(`INSERT INTO task_categories (id, code, name, color, icon, description) VALUES (?, ?, ?, ?, ?, ?)`);
  const categories = [
    { id: 'cat-med', code: 'MED', name: 'Medication Administration', color: 'rose', icon: 'Pill', description: 'Oral, IV, IM and infusion medication dispensation' },
    { id: 'cat-vitals', code: 'VITALS', name: 'Vitals & Monitoring', color: 'teal', icon: 'Activity', description: 'BP, Pulse, SpO2, Temp, GCS, blood sugar check' },
    { id: 'cat-wound', code: 'WOUND', name: 'Wound Dressing & Drain', color: 'amber', icon: 'Bandage', description: 'Aseptic surgical dressing, suture care, drain discharge' },
    { id: 'cat-care', code: 'CARE', name: 'Patient Hygiene & Repositioning', color: 'sky', icon: 'Heart', description: 'Bed bath, back care, 2-hourly Q2H turning' },
    { id: 'cat-lab', code: 'LAB', name: 'Lab Sample Collection', color: 'purple', icon: 'FlaskConical', description: 'Blood draws, cultures, ABG, urine sample sent' },
    { id: 'cat-proc', code: 'PROC', name: 'Procedure Assistance', color: 'indigo', icon: 'Stethoscope', description: 'Central line assist, intubation assist, chest tube, catheterization' },
    { id: 'cat-disinfect', code: 'DISINFECT', name: 'Ward Infection Control', color: 'emerald', icon: 'ShieldCheck', description: 'Terminal bed cleaning, autoclave check, bio-hazard waste bag clearance' },
    { id: 'cat-equip', code: 'EQUIP', name: 'Equipment Verification', color: 'orange', icon: 'Cpu', description: 'Crash cart audit, defibrillator test, syringe pump calibration' },
  ];
  for (const c of categories) {
    catStmt.run(c.id, c.code, c.name, c.color, c.icon, c.description);
  }

  console.log('Seeding register templates (9 clinical registers)...');
  const regTplStmt = db.prepare(`INSERT INTO register_templates (id, code, name, description, fields_schema, active) VALUES (?, ?, ?, ?, ?, 1)`);
  const regTemplates = [
    {
      id: 'tpl-daily',
      code: 'daily_nursing_activity',
      name: 'Daily Nursing Activity Register',
      description: 'Shift-wise nursing interventions, patient census, bed occupancy and rounds summary',
      schema: [
        { key: 'bedNo', label: 'Bed / Room No.', type: 'text', required: true },
        { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
        { key: 'uhid', label: 'UHID / IP No.', type: 'text', required: true },
        { key: 'diagnosis', label: 'Primary Diagnosis', type: 'text', required: true },
        { key: 'activityPerformed', label: 'Clinical Interventions Performed', type: 'textarea', required: true },
        { key: 'fluidIntakeOutput', label: 'I/O Balance (ml)', type: 'text', required: false },
        { key: 'dietStatus', label: 'Diet / NPO Status', type: 'text', required: false },
        { key: 'doctorRoundsBy', label: 'Attending Physician Rounds', type: 'text', required: true },
      ]
    },
    {
      id: 'tpl-shift',
      code: 'shift_duty',
      name: 'Shift Duty Register',
      description: 'Records staff on duty, bed allocation, emergency coverage and supervisor sign-off',
      schema: [
        { key: 'shiftName', label: 'Shift (Morning/Evening/Night)', type: 'select', options: ['Morning', 'Evening', 'Night'], required: true },
        { key: 'inChargeNurse', label: 'Ward In-Charge Nurse', type: 'text', required: true },
        { key: 'assignedBedsRange', label: 'Assigned Beds Range (e.g. Beds 1-8)', type: 'text', required: true },
        { key: 'totalCensus', label: 'Ward Census at Start', type: 'number', required: true },
        { key: 'criticalPatientsCount', label: 'Critical / High Risk Count', type: 'number', required: true },
        { key: 'doctorOnCall', label: 'Resident / Medical Officer on Duty', type: 'text', required: true },
        { key: 'dutyRemarks', label: 'Duty Handover Remarks', type: 'textarea', required: false },
      ]
    },
    {
      id: 'tpl-adm-dis',
      code: 'patient_admission_discharge',
      name: 'Patient Admission & Discharge Register',
      description: 'Bed transfers, incoming hospital admissions, MLC status, and discharge notes',
      schema: [
        { key: 'entryType', label: 'Event Type', type: 'select', options: ['Admission', 'Discharge', 'Transfer-In', 'Transfer-Out', 'DAMA/LAMA'], required: true },
        { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
        { key: 'uhid', label: 'UHID / IP No.', type: 'text', required: true },
        { key: 'ageGender', label: 'Age / Gender', type: 'text', required: true },
        { key: 'bedNo', label: 'Bed Assigned / Vacated', type: 'text', required: true },
        { key: 'referringSource', label: 'Source / Destination (e.g. Emergency, Home, ICU)', type: 'text', required: true },
        { key: 'mlcStatus', label: 'MLC (Medico-Legal Case)', type: 'select', options: ['Non-MLC', 'MLC Registered'], required: true },
        { key: 'belongingsHandedTo', label: 'Patient Belongings Handed To', type: 'text', required: false },
        { key: 'summaryNotes', label: 'Admission / Discharge Notes', type: 'textarea', required: true }
      ]
    },
    {
      id: 'tpl-notes',
      code: 'nursing_notes',
      name: 'Nursing Clinical Notes (Progress Notes)',
      description: 'SOAP structured or chronologic nursing documentation of patient condition',
      schema: [
        { key: 'bedNo', label: 'Bed No.', type: 'text', required: true },
        { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
        { key: 'uhid', label: 'UHID / IP No.', type: 'text', required: true },
        { key: 'subjective', label: 'Subjective (Patient Complaints)', type: 'textarea', required: true },
        { key: 'objective', label: 'Objective (Vitals, Assessment Findings)', type: 'textarea', required: true },
        { key: 'assessment', label: 'Nursing Assessment & Diagnosis', type: 'textarea', required: true },
        { key: 'plan', label: 'Nursing Care Plan & Interventions', type: 'textarea', required: true },
        { key: 'physicianNotified', label: 'Physician Informed (Doctor Name)', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-mar',
      code: 'medication_administration',
      name: 'Medication Administration Register (MAR)',
      description: 'Drug administration records, batch verification, route, dosage and omission codes',
      schema: [
        { key: 'bedNo', label: 'Bed No.', type: 'text', required: true },
        { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
        { key: 'uhid', label: 'UHID', type: 'text', required: true },
        { key: 'medicationName', label: 'Drug Name & Strength', type: 'text', required: true },
        { key: 'dosage', label: 'Dose (e.g. 1g, 500mg, 10 units)', type: 'text', required: true },
        { key: 'route', label: 'Route', type: 'select', options: ['IV Infusion', 'IV Bolus', 'Oral', 'Subcutaneous', 'IM', 'Inhalation'], required: true },
        { key: 'scheduledTime', label: 'Scheduled Time (e.g. 08:00, 14:00)', type: 'text', required: true },
        { key: 'actualTimeGiven', label: 'Actual Time Administered', type: 'text', required: true },
        { key: 'adverseReactions', label: 'Adverse Reaction / Allergy Check', type: 'text', required: true },
        { key: 'coSignNurse', label: 'High Alert Drug Co-Sign Nurse (if applicable)', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-equip',
      code: 'equipment_usage',
      name: 'Equipment Usage & Maintenance Register',
      description: 'Log of biomedical equipment, ventilators, defibrillators, infusion pumps and suction units',
      schema: [
        { key: 'equipmentName', label: 'Equipment Name', type: 'text', required: true },
        { key: 'serialNumber', label: 'Bio-Medical Asset Tag / Serial No.', type: 'text', required: true },
        { key: 'bedNo', label: 'Patient / Bed Deployed', type: 'text', required: true },
        { key: 'operationalStatus', label: 'Functioning Status', type: 'select', options: ['Fully Functional', 'Calibration Due', 'Malfunction / Faulty', 'Sanitized / Ready'], required: true },
        { key: 'cleanStatus', label: 'Decontaminated Between Patients', type: 'select', options: ['Yes - Verified', 'Pending Cleaning'], required: true },
        { key: 'remarks', label: 'Operating Parameters / Alarms Checked', type: 'textarea', required: false }
      ]
    },
    {
      id: 'tpl-incident',
      code: 'incident_report',
      name: 'Incident Report Register',
      description: 'Non-punitive clinical incident, medication error, needle stick, fall, or equipment failure reporting',
      schema: [
        { key: 'incidentCategory', label: 'Incident Category', type: 'select', options: ['Patient Fall', 'Medication Near-Miss/Error', 'Needlestick Injury', 'Equipment Breakdown', 'Patient Infiltration', 'Documentation Error'], required: true },
        { key: 'severityLevel', label: 'Severity Scale', type: 'select', options: ['Near-Miss (No Harm)', 'Minor (Monitoring needed)', 'Moderate (Intervention required)', 'Major / Sentinel'], required: true },
        { key: 'bedOrLocation', label: 'Location / Bed No.', type: 'text', required: true },
        { key: 'descriptionOfEvent', label: 'Factual Description of Incident', type: 'textarea', required: true },
        { key: 'immediateActionTaken', label: 'Immediate Corrective Action Taken', type: 'textarea', required: true },
        { key: 'physicianInformedName', label: 'Attending Physician Informed', type: 'text', required: true },
        { key: 'supervisorNotified', label: 'Nursing Supervisor Informed', type: 'text', required: true }
      ]
    },
    {
      id: 'tpl-stock-reg',
      code: 'stock_receipt_issue',
      name: 'Stock Receipt & Issue Register',
      description: 'Ward-level physical ledger of consumable supplies and emergency cart stock movements',
      schema: [
        { key: 'itemName', label: 'Item Name & Specification', type: 'text', required: true },
        { key: 'transactionType', label: 'Movement Type', type: 'select', options: ['Received from Central Pharmacy', 'Consumed / Administered to Bed', 'Transferred to another Ward', 'Discarded / Broken'], required: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true },
        { key: 'batchNumber', label: 'Batch No.', type: 'text', required: true },
        { key: 'balanceOnHand', label: 'Closing Ward Balance', type: 'number', required: true },
        { key: 'notes', label: 'Reason / Requisition Reference', type: 'text', required: false }
      ]
    },
    {
      id: 'tpl-handover',
      code: 'handover_register',
      name: 'Handover Register (ISBAR Format)',
      description: 'Formal digital record of shift-to-shift ISBAR clinical handovers',
      schema: [
        { key: 'shiftTransition', label: 'Shift Transition', type: 'text', required: true },
        { key: 'totalPatients', label: 'Total Patients Handed Over', type: 'number', required: true },
        { key: 'ventilatorPatients', label: 'Patients on Ventilator / BiPAP', type: 'number', required: false },
        { key: 'highAlertMeds', label: 'High Alert Infusions Active', type: 'text', required: false },
        { key: 'pendingTasksSummary', label: 'Pending Blood Draws / Tests to Track', type: 'textarea', required: true },
        { key: 'incomingNurseConfirmation', label: 'Incoming Nurse Digital Name', type: 'text', required: true },
      ]
    }
  ];

  for (const t of regTemplates) {
    regTplStmt.run(t.id, t.code, t.name, t.description, JSON.stringify(t.schema));
  }

  console.log('Seeding inventory suppliers...');
  const suppStmt = db.prepare(`INSERT INTO suppliers (id, name, contact_person, phone, email, address, lead_time_days) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const suppliers = [
    { id: 'supp-medplus', name: 'MedPlus Healthcare Wholesale Ltd', contact: 'Vivek Sharma', phone: '+91 98110 54321', email: 'orders@medpluswholesale.in', address: 'Plot 44, Peenya Industrial Area, Bengaluru', leadTime: 2 },
    { id: 'supp-bharat', name: 'Bharat Bio-Surgicals & Pharmaceuticals', contact: 'Manoj Patel', phone: '+91 98220 87654', email: 'supply@bharatbiosurgicals.com', address: 'GIDC Industrial Estate, Vadodara, Gujarat', leadTime: 3 },
    { id: 'supp-apollo', name: 'Apollo Clinical Logistics & Devices', contact: 'Pooja Reddy', phone: '+91 98440 12389', email: 'support@apollologistics.in', address: 'Road No 12, Banjara Hills, Hyderabad', leadTime: 1 },
  ];
  for (const s of suppliers) {
    suppStmt.run(s.id, s.name, s.contact, s.phone, s.email, s.address, s.leadTime);
  }

  console.log('Seeding inventory items & realistic batches...');
  const itemStmt = db.prepare(`
    INSERT INTO inventory_items (id, code, name, category, unit, min_stock, ward_id, supplier_id, cost_per_unit, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const batchStmt = db.prepare(`
    INSERT INTO inventory_batches (id, item_id, batch_number, quantity, initial_quantity, expiry_date, purchase_date, cost_per_unit, location_bin, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const wardInvStmt = db.prepare(`INSERT INTO ward_inventory (id, ward_id, item_id, quantity) VALUES (?, ?, ?, ?)`);

  const inventoryCatalog = [
    {
      id: 'inv-ns500',
      code: 'IV-NS-500',
      name: 'Normal Saline 0.9% IV (500ml Ecoflac)',
      category: 'Pharmaceuticals',
      unit: 'Bottles',
      minStock: 80,
      wardId: 'ward-micu',
      supplierId: 'supp-medplus',
      cost: 42.50,
      desc: 'Isotonic crystalloid for fluid resuscitation and IV line maintenance',
      batches: [
        { batchNo: 'NS26A12', qty: 150, initQty: 200, exp: '2027-08-31', status: 'ACTIVE', bin: 'Aisle 1 - Bay B' },
        { batchNo: 'NS25K08', qty: 45, initQty: 100, exp: '2026-11-15', status: 'ACTIVE', bin: 'Aisle 1 - Bay B' } // Near expiry!
      ]
    },
    {
      id: 'inv-rl500',
      code: 'IV-RL-500',
      name: 'Ringer Lactate Infusion (500ml)',
      category: 'Pharmaceuticals',
      unit: 'Bottles',
      minStock: 60,
      wardId: 'ward-fsw',
      supplierId: 'supp-medplus',
      cost: 48.00,
      desc: 'Balanced electrolyte solution for surgical and trauma hydration',
      batches: [
        { batchNo: 'RL26C04', qty: 120, initQty: 150, exp: '2027-10-31', status: 'ACTIVE', bin: 'Aisle 1 - Bay C' }
      ]
    },
    {
      id: 'inv-gloves75',
      code: 'SURG-GLV-75',
      name: 'Sterile Surgical Gloves (Powder-Free, Size 7.5)',
      category: 'Surgical',
      unit: 'Pairs',
      minStock: 100,
      wardId: 'ward-fsw',
      supplierId: 'supp-bharat',
      cost: 32.00,
      desc: 'Micro-textured latex sterile surgical gloves with beaded cuff',
      batches: [
        { batchNo: 'GLV26F11', qty: 250, initQty: 300, exp: '2028-03-31', status: 'ACTIVE', bin: 'Surg Storage Shelf 2' }
      ]
    },
    {
      id: 'inv-syr5ml',
      code: 'DISP-SYR-05',
      name: 'Dispo-Van Luer Lock Syringes with Needle (5ml)',
      category: 'Consumables',
      unit: 'Pieces',
      minStock: 150,
      wardId: 'ward-micu',
      supplierId: 'supp-bharat',
      cost: 6.50,
      desc: 'Single use sterile syringe with 23G needle for medication draw',
      batches: [
        { batchNo: 'SYR26D01', qty: 380, initQty: 500, exp: '2028-01-31', status: 'ACTIVE', bin: 'Consumable Rack C' }
      ]
    },
    {
      id: 'inv-ivset',
      code: 'CONS-IVSET-STD',
      name: 'Vented IV Infusion Set with Air Filter & Roller Clamp',
      category: 'Consumables',
      unit: 'Pieces',
      minStock: 75,
      wardId: 'ward-etr',
      supplierId: 'supp-apollo',
      cost: 28.00,
      desc: 'Gravity infusion line with sharp spike and 20 drops/ml drip rate',
      batches: [
        { batchNo: 'IVS26E20', qty: 90, initQty: 150, exp: '2027-06-30', status: 'ACTIVE', bin: 'Aisle 2 - Box 4' }
      ]
    },
    {
      id: 'inv-cannula20',
      code: 'CANN-20G-PNK',
      name: 'IV Cannula with Injection Port & Wings (20G Pink)',
      category: 'Consumables',
      unit: 'Pieces',
      minStock: 60,
      wardId: 'ward-etr',
      supplierId: 'supp-apollo',
      cost: 35.00,
      desc: 'PTFE radiopaque cannula for general IV infusion and blood transfusion',
      batches: [
        { batchNo: 'CAN26B09', qty: 85, initQty: 100, exp: '2027-09-30', status: 'ACTIVE', bin: 'Emergency Cart Drawer 1' }
      ]
    },
    {
      id: 'inv-pcm100',
      code: 'PHARM-PCM-IV',
      name: 'Paracetamol Infusion 10mg/ml (100ml IV Bag)',
      category: 'Pharmaceuticals',
      unit: 'Vials',
      minStock: 50,
      wardId: 'ward-mmw',
      supplierId: 'supp-medplus',
      cost: 85.00,
      desc: 'Analgesic and antipyretic for acute pain management and febrile episodes',
      batches: [
        { batchNo: 'PCM25H14', qty: 22, initQty: 80, exp: '2026-11-28', status: 'ACTIVE', bin: 'Pharmacy Cold Cabinet' } // Low stock & near expiry
      ]
    },
    {
      id: 'inv-ceft1g',
      code: 'PHARM-CEFT-1G',
      name: 'Ceftriaxone Injection 1g Vial with Sterile WFI',
      category: 'Pharmaceuticals',
      unit: 'Vials',
      minStock: 40,
      wardId: 'ward-micu',
      supplierId: 'supp-medplus',
      cost: 72.00,
      desc: 'Third-generation cephalosporin broad-spectrum antibiotic',
      batches: [
        { batchNo: 'CFT26J05', qty: 65, initQty: 100, exp: '2027-12-31', status: 'ACTIVE', bin: 'Antibiotic Safe Box' }
      ]
    },
    {
      id: 'inv-gauze',
      code: 'SURG-GAUZ-SWB',
      name: 'Sterile Gauze Swabs 10cm x 10cm (Pack of 5)',
      category: 'Surgical',
      unit: 'Packs',
      minStock: 80,
      wardId: 'ward-fsw',
      supplierId: 'supp-bharat',
      cost: 24.00,
      desc: '100% absorbent cotton 12-ply sterile dressing swabs',
      batches: [
        { batchNo: 'GSW26A18', qty: 140, initQty: 200, exp: '2028-02-28', status: 'ACTIVE', bin: 'Wound Dressing Tray' }
      ]
    },
    {
      id: 'inv-n95',
      code: 'PPE-MASK-N95',
      name: 'N95 Particulate Respirator Mask (NIOSH Certified)',
      category: 'PPE',
      unit: 'Pieces',
      minStock: 50,
      wardId: 'ward-micu',
      supplierId: 'supp-bharat',
      cost: 45.00,
      desc: 'High filtration fluid-resistant respirator for aerosol-generating procedures',
      batches: [
        { batchNo: 'N95-2601', qty: 120, initQty: 150, exp: '2029-01-01', status: 'ACTIVE', bin: 'PPE Locker 1' }
      ]
    },
    {
      id: 'inv-chlorhex',
      code: 'DISINF-CHX-500',
      name: 'Chlorhexidine Gluconate 4% Surgical Scrub (500ml)',
      category: 'Consumables',
      unit: 'Bottles',
      minStock: 25,
      wardId: 'ward-micu',
      supplierId: 'supp-apollo',
      cost: 165.00,
      desc: 'Antimicrobial skin cleanser for preoperative hand scrub and skin prep',
      batches: [
        { batchNo: 'CHX25M02', qty: 18, initQty: 50, exp: '2026-12-15', status: 'ACTIVE', bin: 'Scrub Station' } // Below min stock (18 < 25)
      ]
    }
  ];

  for (const item of inventoryCatalog) {
    itemStmt.run(
      item.id,
      item.code,
      item.name,
      item.category,
      item.unit,
      item.minStock,
      item.wardId,
      item.supplierId,
      item.cost,
      item.desc
    );

    let totalItemQty = 0;
    for (const b of item.batches) {
      batchStmt.run(
        crypto.randomUUID(),
        item.id,
        b.batchNo,
        b.qty,
        b.initQty,
        b.exp,
        '2026-02-15',
        item.cost,
        b.bin,
        b.status
      );
      totalItemQty += b.qty;
    }

    if (item.wardId) {
      wardInvStmt.run(crypto.randomUUID(), item.wardId, item.id, Math.floor(totalItemQty * 0.3));
    }
  }

  console.log('Seeding clinical tasks...');
  const taskStmt = db.prepare(`
    INSERT INTO tasks (
      id, title, description, category_id, ward_id, assigned_to, created_by,
      priority, status, due_date, recurrence, patient_reference, instructions,
      completed_at, completed_by, escalated, escalated_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const commentStmt = db.prepare(`INSERT INTO task_comments (id, task_id, user_id, comment, created_at) VALUES (?, ?, ?, ?, ?)`);
  const historyStmt = db.prepare(`INSERT INTO task_history (id, task_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`);

  const now = new Date();
  const formatTime = (hoursOffset: number) => {
    const d = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);
    return d.toISOString();
  };

  const tasksData = [
    {
      id: 'task-1',
      title: 'Administer IV Ceftriaxone 1g slow infusion',
      description: 'Patient admitted with post-operative fever spike (101.4 F). Drug susceptibility confirms sensitivity.',
      categoryId: 'cat-med',
      wardId: 'ward-micu',
      assignedTo: 'usr-priya',
      createdBy: 'usr-sunita',
      priority: 'Urgent',
      status: 'In Progress',
      dueDate: formatTime(1),
      recurrence: 'EVERY_SHIFT',
      patientRef: 'Bed 4 - Mr. Gopal Das (UHID-2026-8912)',
      instructions: 'Infuse over 30 minutes in 100ml NS. Monitor for rash or signs of hypersensitivity. Check cannula patency first.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: [
        { user: 'usr-sunita', text: 'Blood culture drawn 20 mins ago. Please administer antibiotic without delay.' },
        { user: 'usr-priya', text: '100ml NS bag primed. Line checked, starting infusion now.' }
      ]
    },
    {
      id: 'task-2',
      title: 'Perform Q2H Arterial Blood Gas (ABG) & Ventilator Check',
      description: 'Intubated patient on Volume Control mode. Weaning protocol underway, assess PaO2/FiO2 ratio.',
      categoryId: 'cat-vitals',
      wardId: 'ward-micu',
      assignedTo: 'usr-priya',
      createdBy: 'usr-sunita',
      priority: 'High',
      status: 'Pending',
      dueDate: formatTime(2),
      recurrence: 'EVERY_SHIFT',
      patientRef: 'Bed 2 - Mrs. Sangeeta Verma (UHID-2026-9041)',
      instructions: 'Collect from left radial arterial line after flushing. Deliver on crushed ice to ICU lab within 10 minutes.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: []
    },
    {
      id: 'task-3',
      title: 'Aseptic Laparotomy Wound Dressing & Jackson-Pratt Drain Check',
      description: 'Day 3 post emergency exploratory laparotomy. Observe serosanguinous output and record drain volume.',
      categoryId: 'cat-wound',
      wardId: 'ward-fsw',
      assignedTo: 'usr-mary',
      createdBy: 'usr-sneha',
      priority: 'Medium',
      status: 'Completed',
      dueDate: formatTime(-2),
      recurrence: 'DAILY',
      patientRef: 'Bed 12 - Mrs. Lakshmi Narayanan (UHID-2026-7844)',
      instructions: 'Sterile Betadine & normal saline clean. Count swabs. Re-clamp suction bulb with active negative pressure.',
      completedAt: formatTime(-1),
      completedBy: 'usr-mary',
      escalated: 0,
      escalatedReason: null,
      comments: [
        { user: 'usr-mary', text: 'Dressing completed with sterile technique. Drain output was 45ml serosanguinous, no purulent odor.' }
      ]
    },
    {
      id: 'task-4',
      title: 'Crash Cart Defibrillator & Emergency Meds Daily Audit',
      description: 'Mandatory start-of-shift inspection of resuscitation equipment and pediatric paddles.',
      categoryId: 'cat-equip',
      wardId: 'ward-micu',
      assignedTo: 'usr-priya',
      createdBy: 'usr-sunita',
      priority: 'High',
      status: 'Completed',
      dueDate: formatTime(-3),
      recurrence: 'DAILY',
      patientRef: 'Ward Station - Crash Cart #MICU-01',
      instructions: 'Perform 30-Joule test discharge on tester load. Verify laryngoscope bulbs, Ambu bag, and Epinephrine ampoules expiry.',
      completedAt: formatTime(-2),
      completedBy: 'usr-priya',
      escalated: 0,
      escalatedReason: null,
      comments: [
        { user: 'usr-priya', text: 'Crash cart test discharge passed. Seal intact. All 10 Epinephrine 1mg vials in date.' }
      ]
    },
    {
      id: 'task-5',
      title: 'STAT 12-Lead ECG for Acute Chest Discomfort',
      description: 'Patient complaining of sub-sternal heaviness radiating to left shoulder. BP 150/94.',
      categoryId: 'cat-vitals',
      wardId: 'ward-etr',
      assignedTo: 'usr-ananya',
      createdBy: 'usr-ananya',
      priority: 'Urgent',
      status: 'In Progress',
      dueDate: formatTime(0.5),
      recurrence: 'NONE',
      patientRef: 'Triage Bed 1 - Mr. Abdul Rahim (UHID-2026-9932)',
      instructions: 'Run 12-lead ECG, keep machine calibrated at 25mm/s and 10mm/mV. Notify on-duty cardiology resident immediately.',
      completedAt: null,
      completedBy: null,
      escalated: 1,
      escalatedReason: 'ST changes observed in leads V2-V4. Urgent physician review required.',
      comments: [
        { user: 'usr-ananya', text: 'ECG recorded and handed to Dr. Mehta. Troponin I sent to lab STAT.' }
      ]
    },
    {
      id: 'task-6',
      title: 'Blood Glucose Monitoring (CBG) & Sliding Scale Insulin',
      description: 'Type 2 Diabetic on broad spectrum steroid therapy. Target pre-meal glucose 140-180 mg/dL.',
      categoryId: 'cat-vitals',
      wardId: 'ward-mmw',
      assignedTo: 'usr-deepa',
      createdBy: 'usr-sunita',
      priority: 'Medium',
      status: 'Pending',
      dueDate: formatTime(3),
      recurrence: 'EVERY_SHIFT',
      patientRef: 'Bed 8 - Mr. K. Venkataraman (UHID-2026-8120)',
      instructions: 'Check glucometer reading prior to dinner. If >200 mg/dL, administer 4 units Regular Human Insulin SubQ.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: []
    },
    {
      id: 'task-7',
      title: 'Terminal Disinfection & Bed Sterilization post discharge',
      description: 'Bed 16 vacated following MRSA negative swab. Perform full deep disinfection protocol.',
      categoryId: 'cat-disinfect',
      wardId: 'ward-micu',
      assignedTo: 'usr-priya',
      createdBy: 'usr-sunita',
      priority: 'Medium',
      status: 'Pending',
      dueDate: formatTime(4),
      recurrence: 'NONE',
      patientRef: 'Bed 16 - Isolation Cubicle',
      instructions: 'Use 0.5% Sodium Hypochlorite on hard surfaces. Change all ventilator tubing and curtains. Keep cubicle closed 1 hr.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: []
    },
    {
      id: 'task-8',
      title: 'Urgent Packed Red Blood Cells (PRBC) Crossmatch & Transfusion',
      description: 'Post-op hemoglobin dropped to 6.8 g/dL with tachycardia. 2 units PRBC ordered by surgical team.',
      categoryId: 'cat-med',
      wardId: 'ward-fsw',
      assignedTo: 'usr-mary',
      createdBy: 'usr-sneha',
      priority: 'Urgent',
      status: 'Pending',
      dueDate: formatTime(1.5),
      recurrence: 'NONE',
      patientRef: 'Bed 15 - Mrs. Fatima Begum (UHID-2026-7201)',
      instructions: 'Double-check blood unit bag label with second RN. Pre-transfusion vitals. Infuse initial 50ml at slow rate.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: []
    },
    {
      id: 'task-9',
      title: 'Pre-operative Fasting & Chlorhexidine Skin Wash Verification',
      description: 'Scheduled for Total Knee Arthroplasty tomorrow at 08:30. NPO from 24:00 midnight.',
      categoryId: 'cat-care',
      wardId: 'ward-fsw',
      assignedTo: 'usr-mary',
      createdBy: 'usr-sneha',
      priority: 'Low',
      status: 'Pending',
      dueDate: formatTime(6),
      recurrence: 'NONE',
      patientRef: 'Bed 9 - Mrs. Hemavathi K. (UHID-2026-6411)',
      instructions: 'Confirm NPO signage at bedside. Ensure Hibiscrub full body shower taken. Consent form signed in chart.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: []
    },
    {
      id: 'task-10',
      title: 'Overdue Foley Catheter Replacement & Urine Analysis',
      description: 'Indwelling Foley catheter in place for 14 days. Routine replacement and urine culture collection.',
      categoryId: 'cat-proc',
      wardId: 'ward-mmw',
      assignedTo: 'usr-deepa',
      createdBy: 'usr-sunita',
      priority: 'High',
      status: 'Pending',
      dueDate: formatTime(-1.5), // OVERDUE!
      recurrence: 'NONE',
      patientRef: 'Bed 18 - Mr. Balachandran (UHID-2026-5541)',
      instructions: 'Use silicone 16Fr Foley with sterile catheterization tray. Obtain midstream sample from sampling port.',
      completedAt: null,
      completedBy: null,
      escalated: 0,
      escalatedReason: null,
      comments: [
        { user: 'usr-sunita', text: 'Task is overdue from morning shift. Please prioritize before evening handover.' }
      ]
    }
  ];

  for (const t of tasksData) {
    taskStmt.run(
      t.id,
      t.title,
      t.description,
      t.categoryId,
      t.wardId,
      t.assignedTo,
      t.createdBy,
      t.priority,
      t.status,
      t.dueDate,
      t.recurrence,
      t.patientRef,
      t.instructions,
      t.completedAt,
      t.completedBy,
      t.escalated,
      t.escalatedReason,
      formatTime(-4)
    );

    historyStmt.run(
      crypto.randomUUID(),
      t.id,
      t.createdBy,
      'TASK_CREATED',
      `Task created with priority ${t.priority}`,
      formatTime(-4)
    );

    for (const c of t.comments) {
      commentStmt.run(crypto.randomUUID(), t.id, c.user, c.text, formatTime(-2));
    }
  }

  console.log('Seeding digital register entries with realistic clinical samples...');
  const regEntryStmt = db.prepare(`
    INSERT INTO register_entries (id, register_code, ward_id, user_id, date, data_json, status, current_version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = now.toISOString().split('T')[0];

  const sampleRegisterEntries = [
    {
      id: 'reg-ent-1',
      code: 'daily_nursing_activity',
      wardId: 'ward-micu',
      userId: 'usr-priya',
      date: todayStr,
      status: 'FINAL',
      version: 1,
      data: {
        bedNo: 'MICU Bed 4',
        patientName: 'Gopal Das',
        uhid: 'UHID-2026-8912',
        diagnosis: 'Severe Community-Acquired Pneumonia with Sepsis',
        activityPerformed: 'Hourly hemodynamic monitoring, suctioning via closed in-line circuit, IV antibiotics administered, arterial line site inspected, repositioned to 30 deg semi-fowler.',
        fluidIntakeOutput: 'Intake: 1450 ml | Output: 1100 ml (Positive +350 ml)',
        dietStatus: 'Ryles Tube Feed 150ml 2-hourly',
        doctorRoundsBy: 'Dr. Anand Murthy (Senior Intensivist)'
      }
    },
    {
      id: 'reg-ent-2',
      code: 'medication_administration',
      wardId: 'ward-micu',
      userId: 'usr-priya',
      date: todayStr,
      status: 'FINAL',
      version: 1,
      data: {
        bedNo: 'MICU Bed 2',
        patientName: 'Sangeeta Verma',
        uhid: 'UHID-2026-9041',
        medicationName: 'Noradrenaline Infusion (4mg in 50ml D5W)',
        dosage: '0.08 mcg/kg/min titrated for MAP > 65 mmHg',
        route: 'IV Infusion',
        scheduledTime: 'Continuous Infusion',
        actualTimeGiven: '08:00 ongoing',
        adverseReactions: 'No peripheral extravasation. Central venous catheter lumen patent.',
        coSignNurse: 'Sister Sunita Rao (Head Nurse)'
      }
    },
    {
      id: 'reg-ent-3',
      code: 'patient_admission_discharge',
      wardId: 'ward-fsw',
      userId: 'usr-mary',
      date: todayStr,
      status: 'FINAL',
      version: 1,
      data: {
        entryType: 'Admission',
        patientName: 'Rukmini Bai',
        uhid: 'UHID-2026-9204',
        ageGender: '58 Yrs / Female',
        bedNo: 'Bed 14',
        referringSource: 'Emergency Room',
        mlcStatus: 'Non-MLC',
        belongingsHandedTo: 'Handed to son (Mr. Suresh Bai)',
        summaryNotes: 'Admitted with acute calculous cholecystitis. IV fluids started, scheduled for laparoscopic cholecystectomy in next morning list.'
      }
    },
    {
      id: 'reg-ent-4',
      code: 'incident_report',
      wardId: 'ward-etr',
      userId: 'usr-ananya',
      date: todayStr,
      status: 'FINAL',
      version: 1,
      data: {
        incidentCategory: 'Medication Near-Miss/Error',
        severityLevel: 'Near-Miss (No Harm)',
        bedOrLocation: 'Triage Observation Bed 3',
        descriptionOfEvent: 'Pharmacy dispensed Cefotaxime 1g instead of Ceftriaxone 1g ordered for patient. Caught during double check at bedside before reconstitution.',
        immediateActionTaken: 'Vial quarantined and returned to emergency pharmacy satellite with incident log. Correct drug retrieved and verified.',
        physicianInformedName: 'Dr. Mehta (Emergency CMO)',
        supervisorNotified: 'Sister Sunita Rao'
      }
    }
  ];

  for (const ent of sampleRegisterEntries) {
    regEntryStmt.run(ent.id, ent.code, ent.wardId, ent.userId, ent.date, JSON.stringify(ent.data), ent.status, ent.version, formatTime(-3));
  }

  console.log('Seeding stock requests...');
  const reqStmt = db.prepare(`
    INSERT INTO stock_requests (id, request_no, ward_id, requested_by, status, urgency, notes, reviewed_by, review_comment, reviewed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const reqItemStmt = db.prepare(`
    INSERT INTO stock_request_items (id, request_id, item_id, quantity_requested, quantity_approved, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const req1Id = crypto.randomUUID();
  reqStmt.run(
    req1Id,
    'REQ-2026-0041',
    'ward-micu',
    'usr-priya',
    'Pending',
    'Urgent',
    'ICU consumables restock ahead of night shift. Multiple ventilated patients admitted.',
    null,
    null,
    null,
    formatTime(-3)
  );
  reqItemStmt.run(crypto.randomUUID(), req1Id, 'inv-ns500', 30, 0, 'Fast consumption for drug diluents');
  reqItemStmt.run(crypto.randomUUID(), req1Id, 'inv-syr5ml', 50, 0, 'Syringe pump refills');
  reqItemStmt.run(crypto.randomUUID(), req1Id, 'inv-ceft1g', 15, 0, 'ICU reserve depleted');

  const req2Id = crypto.randomUUID();
  reqStmt.run(
    req2Id,
    'REQ-2026-0040',
    'ward-fsw',
    'usr-mary',
    'Approved',
    'Normal',
    'Weekly surgical wound dressing consumables indent',
    'usr-rajesh',
    'Approved as per quota allocation. Dispatched to ward store.',
    formatTime(-10),
    formatTime(-24)
  );
  reqItemStmt.run(crypto.randomUUID(), req2Id, 'inv-gloves75', 40, 40, 'Ward stock replenishment');
  reqItemStmt.run(crypto.randomUUID(), req2Id, 'inv-gauze', 30, 30, 'Sterile dressings');

  console.log('Seeding shift assignments & roster...');
  const assignStmt = db.prepare(`
    INSERT INTO shift_assignments (id, shift_id, user_id, ward_id, date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-priya', 'ward-micu', todayStr, 'ON_DUTY', 'Beds 1 to 6 in charge');
  assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-mary', 'ward-fsw', todayStr, 'ON_DUTY', 'Surgical post-op beds in charge');
  assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-ananya', 'ward-etr', todayStr, 'ON_DUTY', 'Triage resuscitation bay');
  assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-deepa', 'ward-mmw', todayStr, 'ON_DUTY', 'General medical beds 1-14');
  assignStmt.run(crypto.randomUUID(), 'shift-eve', 'usr-priya', 'ward-micu', todayStr, 'SCHEDULED', 'Coverage requested for weaning protocol');
  assignStmt.run(crypto.randomUUID(), 'shift-night', 'usr-deepa', 'ward-mmw', todayStr, 'SCHEDULED', 'Night medication rounds');

  console.log('Seeding structured handover records...');
  const handoverStmt = db.prepare(`
    INSERT INTO handovers (
      id, ward_id, shift_id, date, outgoing_nurse_id, incoming_nurse_id,
      status, notes, equipment_issues, unresolved_incidents, pending_task_ids,
      completed_at, acknowledged_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const handoverId = crypto.randomUUID();
  handoverStmt.run(
    handoverId,
    'ward-micu',
    'shift-morn',
    todayStr,
    'usr-priya',
    'usr-sunita',
    'PENDING_ACKNOWLEDGEMENT',
    'Overall calm shift in MICU. Bed 4 spike in temp noted at 11:30, antibiotics started. Bed 2 on weaning trial with stable vitals.',
    'Syringe pump #SP-04 in Bed 6 battery indicator fluctuating, reported to biomedical maintenance.',
    'No medication errors. Near miss reported in ETR earlier.',
    JSON.stringify(['task-1', 'task-2', 'task-7']),
    formatTime(-0.5),
    null,
    formatTime(-0.5)
  );

  console.log('Seeding in-app notifications...');
  const notifStmt = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, priority, link, is_read, is_acknowledged, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  notifStmt.run(
    crypto.randomUUID(),
    'usr-priya',
    'Urgent Task Assigned: IV Ceftriaxone 1g',
    'You have an urgent medication administration due for Bed 4.',
    'TASK',
    'Urgent',
    '/tasks/task-1',
    0,
    0,
    formatTime(-1)
  );
  notifStmt.run(
    crypto.randomUUID(),
    'usr-priya',
    'Shift Handover Awaiting Acknowledgment',
    'Your outgoing shift handover report is ready for incoming nurse review.',
    'HANDOVER',
    'High',
    `/handover/${handoverId}`,
    0,
    0,
    formatTime(-0.5)
  );
  notifStmt.run(
    crypto.randomUUID(),
    'usr-rajesh',
    'Urgent Ward Stock Request Submitted',
    'Requisition REQ-2026-0041 submitted by Medical ICU requires approval.',
    'INVENTORY',
    'High',
    '/inventory/requests',
    0,
    0,
    formatTime(-2)
  );
  notifStmt.run(
    crypto.randomUUID(),
    'usr-rajesh',
    'Low Stock Alert: Chlorhexidine Scrub 4%',
    'Current store level (18 Bottles) is below safe minimum threshold (25 Bottles).',
    'INVENTORY',
    'Normal',
    '/inventory/inv-chlorhex',
    0,
    0,
    formatTime(-5)
  );

  console.log('Seeding audit logs...');
  const auditStmt = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity, record_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  auditStmt.run(crypto.randomUUID(), 'usr-admin', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'SYS-ROOT', JSON.stringify({ message: 'NurseFlow Clinical System initialized' }), '127.0.0.1', formatTime(-24));
  auditStmt.run(crypto.randomUUID(), 'usr-sunita', 'TASK_CREATE', 'TASK', 'task-1', JSON.stringify({ title: 'Administer IV Ceftriaxone 1g slow infusion', priority: 'Urgent' }), '192.168.1.104', formatTime(-4));
  auditStmt.run(crypto.randomUUID(), 'usr-rajesh', 'STOCK_ISSUED', 'INVENTORY_TRANSACTION', 'TXN-0091', JSON.stringify({ item: 'Sterile Surgical Gloves', qty: 40, ward: 'Female Surgical Ward' }), '192.168.1.115', formatTime(-10));
  auditStmt.run(crypto.randomUUID(), 'usr-priya', 'USER_LOGIN', 'AUTH', 'usr-priya', JSON.stringify({ role: 'Nurse', ward: 'Medical ICU' }), '192.168.1.108', formatTime(-6));

  console.log('✅ NurseFlow database seed completed successfully with complete realistic clinical data.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
