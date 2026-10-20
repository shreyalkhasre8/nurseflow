import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, initDatabase } from './config/db.js';

export function runSeed() {
  console.log('⚡ Starting NurseFlow Enterprise Hospital Dataset Seeding...');
  const startTime = Date.now();
  initDatabase();

  // Wrap all seeding in a single database transaction for maximum performance
  const seedTransaction = db.transaction(() => {
    // 1. Clean existing data in dependency order
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM handover_notes;
      DELETE FROM handover_tasks;
      DELETE FROM handovers;
      DELETE FROM notifications;
      DELETE FROM notification_preferences;
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
      DELETE FROM patients;
      DELETE FROM staff_availability;
      DELETE FROM shift_assignments;
      DELETE FROM shifts;
      DELETE FROM staff_profiles;
      DELETE FROM users;
      DELETE FROM roles;
      DELETE FROM wards;
      DELETE FROM departments;
    `);

    // 2. Departments (7 departments)
    const deptStmt = db.prepare(`INSERT INTO departments (id, code, name, description) VALUES (?, ?, ?, ?)`);
    const depts = [
      { id: 'dept-icu', code: 'ICU', name: 'Intensive Care Unit', description: 'Critical care, hemodynamic monitoring and ventilator support' },
      { id: 'dept-genmed', code: 'GENMED', name: 'General Medicine', description: 'Adult internal medicine, chronic disease management and inpatient acute care' },
      { id: 'dept-surg', code: 'SURG', name: 'General Surgery', description: 'Pre-operative and post-operative surgical inpatient care' },
      { id: 'dept-peds', code: 'PEDS', name: 'Pediatrics & Neonatology', description: 'Pediatric care and neonatal intermediate monitoring' },
      { id: 'dept-emrg', code: 'EMRG', name: 'Emergency & Trauma', description: '24/7 acute triage, resuscitation, and trauma resuscitation care' },
      { id: 'dept-ortho', code: 'ORTHO', name: 'Orthopedics & Joint Care', description: 'Musculoskeletal surgery and trauma post-op care' },
      { id: 'dept-admin', code: 'ADMIN', name: 'Hospital Administration & Pharmacy', description: 'Operations, nursing governance, central pharmacy and supply chain' },
    ];
    for (const d of depts) {
      deptStmt.run(d.id, d.code, d.name, d.description);
    }

    // 3. Wards (10 clinical wards)
    const wardStmt = db.prepare(`INSERT INTO wards (id, department_id, name, code, floor, bed_capacity) VALUES (?, ?, ?, ?, ?, ?)`);
    const wards = [
      { id: 'ward-micu', departmentId: 'dept-icu', name: 'Medical ICU (MICU)', code: 'MICU-01', floor: '3rd Floor - Block A', bedCapacity: 16 },
      { id: 'ward-sicu', departmentId: 'dept-icu', name: 'Surgical ICU (SICU)', code: 'SICU-02', floor: '3rd Floor - Block B', bedCapacity: 14 },
      { id: 'ward-mmw', departmentId: 'dept-genmed', name: 'Male Medical Ward', code: 'MMW-03', floor: '2nd Floor - Block A', bedCapacity: 28 },
      { id: 'ward-fmw', departmentId: 'dept-genmed', name: 'Female Medical Ward', code: 'FMW-04', floor: '2nd Floor - Block B', bedCapacity: 26 },
      { id: 'ward-fsw', departmentId: 'dept-surg', name: 'Female Surgical Ward', code: 'FSW-05', floor: '4th Floor - Block A', bedCapacity: 24 },
      { id: 'ward-msw', departmentId: 'dept-surg', name: 'Male Surgical Ward', code: 'MSW-06', floor: '4th Floor - Block B', bedCapacity: 24 },
      { id: 'ward-ped', departmentId: 'dept-peds', name: 'Pediatric Care Ward', code: 'PED-07', floor: '1st Floor - Block C', bedCapacity: 20 },
      { id: 'ward-etr', departmentId: 'dept-emrg', name: 'Emergency Triage & Resuscitation', code: 'ETR-08', floor: 'Ground Floor', bedCapacity: 18 },
      { id: 'ward-ortho', departmentId: 'dept-ortho', name: 'Orthopedic Post-Op Ward', code: 'OPOW-09', floor: '5th Floor - Block A', bedCapacity: 22 },
      { id: 'ward-daycare', departmentId: 'dept-genmed', name: 'Day Care & Infusion Center', code: 'DCIC-10', floor: 'Ground Floor - Wing B', bedCapacity: 15 },
    ];
    for (const w of wards) {
      wardStmt.run(w.id, w.departmentId, w.name, w.code, w.floor, w.bedCapacity);
    }

    // 4. Roles
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

    // 5. Users & Profiles (65+ healthcare professionals)
    console.log('  Seeding 65+ realistic hospital staff profiles...');
    const defaultPasswordHash = bcrypt.hashSync('hospital123', 10);
    const userStmt = db.prepare(`
      INSERT INTO users (id, employee_id, name, email, password_hash, role_id, department_id, ward_id, phone, status, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now', '-' || (abs(random()) % 48) || ' hours'))
    `);
    const profileStmt = db.prepare(`
      INSERT INTO staff_profiles (id, user_id, qualification, registration_no, date_of_joining, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Primary demonstration users
    const primaryUsers = [
      { id: 'usr-priya', empId: 'NF-NUR-101', name: 'Priya Sharma', email: 'priya.sharma@nurseflow.local', role: 'role-nurse', dept: 'dept-icu', ward: 'ward-micu', qual: 'B.Sc. Nursing, Critical Care Certified', reg: 'KNC-2018-98442' },
      { id: 'usr-mary', empId: 'NF-NUR-102', name: 'Sister Mary Thomas', email: 'mary.thomas@nurseflow.local', role: 'role-nurse', dept: 'dept-surg', ward: 'ward-fsw', qual: 'G.N.M, Post-Basic B.Sc.', reg: 'KNC-2014-55120' },
      { id: 'usr-ananya', empId: 'NF-NUR-103', name: 'Ananya Patel', email: 'ananya.patel@nurseflow.local', role: 'role-nurse', dept: 'dept-emrg', ward: 'ward-etr', qual: 'B.Sc. Nursing, Trauma Life Support (ATLS)', reg: 'GNC-2020-77319' },
      { id: 'usr-deepa', empId: 'NF-NUR-104', name: 'Deepa Nair', email: 'deepa.nair@nurseflow.local', role: 'role-nurse', dept: 'dept-genmed', ward: 'ward-mmw', qual: 'B.Sc. Nursing', reg: 'TNC-2019-33129' },
      { id: 'usr-sunita', empId: 'NF-SUP-201', name: 'Sunita Rao', email: 'sunita.rao@nurseflow.local', role: 'role-supervisor', dept: 'dept-icu', ward: 'ward-micu', qual: 'M.Sc. Nursing, Clinical Nurse Specialist', reg: 'KNC-2010-12001' },
      { id: 'usr-sneha', empId: 'NF-SUP-202', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@nurseflow.local', role: 'role-supervisor', dept: 'dept-surg', ward: 'ward-fsw', qual: 'M.Sc. Surgical Nursing', reg: 'MNC-2012-44102' },
      { id: 'usr-rajesh', empId: 'NF-INV-301', name: 'Rajesh Kumar', email: 'rajesh.kumar@nurseflow.local', role: 'role-inventory', dept: 'dept-admin', ward: null, qual: 'B.Pharm, Certified Hospital Supply Chain', reg: 'PCI-KA-2015-8812' },
      { id: 'usr-admin', empId: 'NF-ADM-401', name: 'Dr. Ramesh Hegde', email: 'admin@nurseflow.local', role: 'role-admin', dept: 'dept-admin', ward: null, qual: 'MHA, MBBS, Medical Superintendent', reg: 'KMC-2004-66321' },
      // Generic demo login shortcuts (Requirement 69)
      { id: 'usr-demo-nurse', empId: 'NF-DEMO-NUR', name: 'Staff Nurse Demo', email: 'nurse@nurseflow.demo', role: 'role-nurse', dept: 'dept-icu', ward: 'ward-micu', qual: 'B.Sc. Nursing', reg: 'DEMO-RN-001' },
      { id: 'usr-demo-sup', empId: 'NF-DEMO-SUP', name: 'Nursing Supervisor Demo', email: 'headnurse@nurseflow.demo', role: 'role-supervisor', dept: 'dept-icu', ward: 'ward-micu', qual: 'M.Sc. Nursing', reg: 'DEMO-HN-001' },
      { id: 'usr-demo-inv', empId: 'NF-DEMO-INV', name: 'Inventory Manager Demo', email: 'inventory@nurseflow.demo', role: 'role-inventory', dept: 'dept-admin', ward: null, qual: 'B.Pharm, Logistics Lead', reg: 'DEMO-INV-001' },
      { id: 'usr-demo-admin', empId: 'NF-DEMO-ADM', name: 'System Administrator Demo', email: 'admin@nurseflow.demo', role: 'role-admin', dept: 'dept-admin', ward: null, qual: 'Hospital Administration Director', reg: 'DEMO-ADM-001' },
    ];

    const indianFirstNames = [
      'Kavita', 'Ritu', 'Pooja', 'Swati', 'Divya', 'Shweta', 'Shalini', 'Meena', 'Archana', 'Rohini',
      'Sunita', 'Jyothi', 'Bhavna', 'Lakshmi', 'Preeti', 'Aarti', 'Neha', 'Rekha', 'Shilpa', 'Vandana',
      'Suman', 'Geeta', 'Snehal', 'Usha', 'Padma', 'Chitra', 'Kalyani', 'Indira', 'Rashmi', 'Pallavi',
      'Monika', 'Aparna', 'Manjula', 'Devika', 'Lalitha', 'Vidya', 'Kamakshi', 'Sarala', 'Sandhya', 'Renuka'
    ];
    const indianLastNames = [
      'Joshi', 'Deshmukh', 'Verma', 'Kulkarni', 'Menon', 'Singh', 'Hegde', 'Krishnan', 'Bhat', 'Patil',
      'Pillai', 'Reddy', 'Shah', 'Narayanan', 'Agarwal', 'Saxena', 'Tiwari', 'Nambiar', 'Shetty', 'Gupta',
      'Choudhary', 'Sen', 'Shinde', 'Iyer', 'Raghavan', 'Murthy', 'Kamath', 'Sood', 'Das', 'Tripathi'
    ];

    const allUsers: Array<{ id: string; empId: string; name: string; email: string; role: string; dept: string; ward: string | null }> = [];

    for (const u of primaryUsers) {
      userStmt.run(u.id, u.empId, u.name, u.email, defaultPasswordHash, u.role, u.dept, u.ward, '+91 98451 ' + (10000 + Math.floor(Math.random() * 89999)));
      profileStmt.run(crypto.randomUUID(), u.id, u.qual, u.reg, '2020-03-15', '+91 98451 99999');
      allUsers.push(u);
    }

    // Additional 42 Staff Nurses across wards
    const wardKeys = wards.map(w => w.id);
    for (let i = 1; i <= 42; i++) {
      const fName = indianFirstNames[i % indianFirstNames.length];
      const lName = indianLastNames[(i * 3) % indianLastNames.length];
      const name = `${fName} ${lName}`;
      const id = `usr-nurse-${i + 100}`;
      const empId = `NF-NUR-${String(104 + i).padStart(4, '0')}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@nurseflow.local`;
      const assignedWard = wardKeys[i % wardKeys.length];
      const targetDept = wards.find(w => w.id === assignedWard)?.departmentId || 'dept-genmed';

      userStmt.run(id, empId, name, email, defaultPasswordHash, 'role-nurse', targetDept, assignedWard, '+91 98451 ' + (20000 + i));
      profileStmt.run(crypto.randomUUID(), id, 'B.Sc. Nursing', `INC-KA-${2015 + (i % 8)}-${10000 + i}`, '2021-06-01', '+91 98451 88888');
      allUsers.push({ id, empId, name, email, role: 'role-nurse', dept: targetDept, ward: assignedWard });
    }

    // Additional 6 Supervisors
    const supNames = ['Sister Theresa Joseph', 'Geetha Varma', 'Pratibha Patil', 'Nirmala Shenoy', 'Saraswati Rao', 'Sujata Bannerjee'];
    supNames.forEach((name, idx) => {
      const id = `usr-sup-${idx + 10}`;
      const empId = `NF-SUP-${String(203 + idx).padStart(4, '0')}`;
      const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}@nurseflow.local`;
      const assignedWard = wardKeys[(idx * 2) % wardKeys.length];
      const targetDept = wards.find(w => w.id === assignedWard)?.departmentId || 'dept-icu';
      userStmt.run(id, empId, name, email, defaultPasswordHash, 'role-supervisor', targetDept, assignedWard, '+91 98451 ' + (30000 + idx));
      profileStmt.run(crypto.randomUUID(), id, 'M.Sc. Nursing, Ward Leadership', `INC-SUP-${2012 + idx}-${20000 + idx}`, '2017-04-10', '+91 98451 77777');
      allUsers.push({ id, empId, name, email, role: 'role-supervisor', dept: targetDept, ward: assignedWard });
    });

    // Additional 4 Inventory Pharmacists
    const invNames = ['Amit Sengupta', 'Karthik Raman', 'Suresh Rao', 'Vikram Joshi'];
    invNames.forEach((name, idx) => {
      const id = `usr-inv-${idx + 10}`;
      const empId = `NF-INV-${String(302 + idx).padStart(4, '0')}`;
      const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}@nurseflow.local`;
      userStmt.run(id, empId, name, email, defaultPasswordHash, 'role-inventory', 'dept-admin', null, '+91 98451 ' + (40000 + idx));
      profileStmt.run(crypto.randomUUID(), id, 'B.Pharm, Warehouse Certified', `PCI-KA-${2016 + idx}-${30000 + idx}`, '2019-08-20', '+91 98451 66666');
      allUsers.push({ id, empId, name, email, role: 'role-inventory', dept: 'dept-admin', ward: null });
    });

    // Additional 3 Admins
    const adminNames = ['Dr. Arvind Kumar', 'Dr. Meenakshi Sundaram', 'Anand Deshmukh'];
    adminNames.forEach((name, idx) => {
      const id = `usr-admin-${idx + 10}`;
      const empId = `NF-ADM-${String(402 + idx).padStart(4, '0')}`;
      const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}@nurseflow.local`;
      userStmt.run(id, empId, name, email, defaultPasswordHash, 'role-admin', 'dept-admin', null, '+91 98451 ' + (50000 + idx));
      profileStmt.run(crypto.randomUUID(), id, 'Hospital Operations & Informatics', `KMC-ADM-${2008 + idx}-${40000 + idx}`, '2015-01-10', '+91 98451 55555');
      allUsers.push({ id, empId, name, email, role: 'role-admin', dept: 'dept-admin', ward: null });
    });

    // 6. Shifts
    const shiftStmt = db.prepare(`INSERT INTO shifts (id, name, code, start_time, end_time) VALUES (?, ?, ?, ?, ?)`);
    const shifts = [
      { id: 'shift-morn', name: 'Morning Shift', code: 'MORN', startTime: '07:00', endTime: '15:00' },
      { id: 'shift-eve', name: 'Evening Shift', code: 'EVE', startTime: '15:00', endTime: '23:00' },
      { id: 'shift-night', name: 'Night Shift', code: 'NIGHT', startTime: '23:00', endTime: '07:00' },
    ];
    for (const s of shifts) {
      shiftStmt.run(s.id, s.name, s.code, s.startTime, s.endTime);
    }

    // 7. Synthetic Patients (150 patients across 10 wards)
    console.log('  Seeding 150 synthetic inpatient census records...');
    const patientStmt = db.prepare(`
      INSERT INTO patients (id, uhid, name, age, gender, ward_id, bed_number, admission_date, diagnosis, attending_doctor, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const patientDiagnoses = [
      'Type 2 Diabetes with Diabetic Ketoacidosis (DKA)',
      'Severe Community-Acquired Pneumonia with Sepsis',
      'Post-op Day 2 Exploratory Laparotomy for Peritonitis',
      'Acute Anterior Wall Myocardial Infarction (STEMI)',
      'Acute Calculous Cholecystitis under observation',
      'Right Femur Shaft Fracture post ORIF stabilization',
      'Acute Gastroenteritis with Severe Dehydration',
      'Exacerbation of Chronic Obstructive Pulmonary Disease (COPD)',
      'Dengue Fever with Severe Thrombocytopenia (Platelets 28k)',
      'Cerebrovascular Accident (Ischemic Stroke) - Hemiparesis',
      'Subacute Intestinal Obstruction managed conservatively',
      'Bilateral Knee Osteoarthritis post Total Knee Replacement (TKR)',
      'Infected Diabetic Foot Ulcer with Cellulitis',
      'Acute Pyelonephritis with Urosepsis',
      'Polytrauma with Rib Fractures and Hemothorax'
    ];

    const attendingDoctors = [
      'Dr. Anand Murthy (Senior Intensivist)',
      'Dr. Arvind Mehta (General Surgeon)',
      'Dr. Radhika Sen (Internal Medicine)',
      'Dr. K. Srinivas (Cardiologist)',
      'Dr. Praveen Nayak (Orthopedic Surgeon)',
      'Dr. Shalini Rao (Pediatrician)'
    ];

    const allPatients: Array<{ id: string; uhid: string; name: string; wardId: string; bed: string }> = [];

    let pIndex = 1;
    for (const w of wards) {
      const patientsInWard = 15; // 15 patients per ward = 150 total
      for (let b = 1; b <= patientsInWard; b++) {
        const pId = `pat-${pIndex}`;
        const uhid = `UHID-2026-${String(1000 + pIndex)}`;
        const pFName = indianFirstNames[(pIndex * 7) % indianFirstNames.length];
        const pLName = indianLastNames[(pIndex * 11) % indianLastNames.length];
        const gender = (pIndex % 2 === 0) ? 'Female' : 'Male';
        const age = 18 + (pIndex * 5) % 65;
        const diag = patientDiagnoses[pIndex % patientDiagnoses.length];
        const doc = attendingDoctors[pIndex % attendingDoctors.length];
        const bed = `Bed ${b}`;
        const daysAgo = (pIndex % 10) + 1;
        const admDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().split('T')[0];

        patientStmt.run(pId, uhid, `${pFName} ${pLName}`, age, gender, w.id, bed, admDate, diag, doc, 'ADMITTED');
        allPatients.push({ id: pId, uhid, name: `${pFName} ${pLName}`, wardId: w.id, bed });
        pIndex++;
      }
    }

    // 8. Task Categories
    const catStmt = db.prepare(`INSERT INTO task_categories (id, code, name, color, icon, description) VALUES (?, ?, ?, ?, ?, ?)`);
    const categories = [
      { id: 'cat-med', code: 'MED', name: 'Medication Administration', color: 'rose', icon: 'Pill', description: 'Oral, IV, IM and infusion medication dispensation' },
      { id: 'cat-vitals', code: 'VITALS', name: 'Vitals & Monitoring', color: 'teal', icon: 'Activity', description: 'BP, Pulse, SpO2, Temp, GCS, blood sugar check' },
      { id: 'cat-wound', code: 'WOUND', name: 'Wound Dressing & Drain', color: 'amber', icon: 'Bandage', description: 'Aseptic surgical dressing, suture care, drain discharge' },
      { id: 'cat-care', code: 'CARE', name: 'Patient Hygiene & Repositioning', color: 'sky', icon: 'Heart', description: 'Bed bath, back care, 2-hourly Q2H turning' },
      { id: 'cat-lab', code: 'LAB', name: 'Lab Sample Collection', color: 'purple', icon: 'FlaskConical', description: 'Blood draws, cultures, ABG, urine sample sent' },
      { id: 'cat-proc', code: 'PROC', name: 'Procedure Assistance', color: 'indigo', icon: 'Stethoscope', description: 'Central line assist, intubation assist, chest tube, catheterization' },
      { id: 'cat-disinfect', code: 'DISINFECT', name: 'Ward Infection Control', color: 'emerald', icon: 'ShieldCheck', description: 'Terminal bed cleaning, autoclave check, bio-hazard waste clearance' },
      { id: 'cat-equip', code: 'EQUIP', name: 'Equipment Verification', color: 'orange', icon: 'Cpu', description: 'Crash cart audit, defibrillator test, syringe pump calibration' },
    ];
    for (const c of categories) {
      catStmt.run(c.id, c.code, c.name, c.color, c.icon, c.description);
    }

    // 9. Register Templates (9 Clinical Registers)
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
          { key: 'dosage', label: 'Dose', type: 'text', required: true },
          { key: 'route', label: 'Route', type: 'select', options: ['IV Infusion', 'IV Bolus', 'Oral', 'Subcutaneous', 'IM'], required: true },
          { key: 'scheduledTime', label: 'Scheduled Time', type: 'text', required: true },
          { key: 'actualTimeGiven', label: 'Actual Time Administered', type: 'text', required: true },
          { key: 'adverseReactions', label: 'Allergy / Adverse Check', type: 'text', required: true },
        ]
      },
      {
        id: 'tpl-equip',
        code: 'equipment_usage',
        name: 'Equipment Usage & Maintenance Register',
        description: 'Log of biomedical equipment, ventilators, defibrillators, infusion pumps and suction units',
        schema: [
          { key: 'equipmentName', label: 'Equipment Name', type: 'text', required: true },
          { key: 'serialNumber', label: 'Asset Tag / Serial No.', type: 'text', required: true },
          { key: 'bedNo', label: 'Patient / Bed Deployed', type: 'text', required: true },
          { key: 'operationalStatus', label: 'Functioning Status', type: 'select', options: ['Fully Functional', 'Calibration Due', 'Malfunction / Faulty', 'Sanitized / Ready'], required: true },
          { key: 'cleanStatus', label: 'Decontaminated Between Patients', type: 'select', options: ['Yes - Verified', 'Pending Cleaning'], required: true },
        ]
      },
      {
        id: 'tpl-incident',
        code: 'incident_report',
        name: 'Incident Report Register',
        description: 'Non-punitive clinical incident, medication error, needle stick, fall, or equipment failure reporting',
        schema: [
          { key: 'incidentCategory', label: 'Incident Category', type: 'select', options: ['Patient Fall', 'Medication Near-Miss/Error', 'Needlestick Injury', 'Equipment Breakdown', 'Patient Infiltration'], required: true },
          { key: 'severityLevel', label: 'Severity Scale', type: 'select', options: ['Near-Miss (No Harm)', 'Minor (Monitoring needed)', 'Moderate (Intervention required)', 'Major / Sentinel'], required: true },
          { key: 'bedOrLocation', label: 'Location / Bed No.', type: 'text', required: true },
          { key: 'descriptionOfEvent', label: 'Factual Description of Incident', type: 'textarea', required: true },
          { key: 'immediateActionTaken', label: 'Immediate Action Taken', type: 'textarea', required: true },
          { key: 'physicianInformedName', label: 'Attending Physician Informed', type: 'text', required: true },
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
          { key: 'criticalAlerts', label: 'Critical Clinical Alerts', type: 'textarea', required: true },
          { key: 'pendingTasksSummary', label: 'Pending Care Tasks to Follow Up', type: 'textarea', required: true },
          { key: 'incomingNurseConfirmation', label: 'Incoming Nurse Digital Name', type: 'text', required: true },
        ]
      }
    ];
    for (const t of regTemplates) {
      regTplStmt.run(t.id, t.code, t.name, t.description, JSON.stringify(t.schema));
    }

    // 10. Suppliers
    const suppStmt = db.prepare(`INSERT INTO suppliers (id, name, contact_person, phone, email, address, lead_time_days) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const suppliers = [
      { id: 'supp-medplus', name: 'MedPlus Healthcare Wholesale Ltd', contact: 'Vivek Sharma', phone: '+91 98110 54321', email: 'orders@medpluswholesale.in', address: 'Plot 44, Peenya Industrial Area, Bengaluru', leadTime: 2 },
      { id: 'supp-bharat', name: 'Bharat Bio-Surgicals & Pharmaceuticals', contact: 'Manoj Patel', phone: '+91 98220 87654', email: 'supply@bharatbiosurgicals.com', address: 'GIDC Industrial Estate, Vadodara, Gujarat', leadTime: 3 },
      { id: 'supp-apollo', name: 'Apollo Clinical Logistics & Devices', contact: 'Pooja Reddy', phone: '+91 98440 12389', email: 'support@apollologistics.in', address: 'Road No 12, Banjara Hills, Hyderabad', leadTime: 1 },
      { id: 'supp-cipla', name: 'Cipla Institutional Hospital Supply', contact: 'K. Ramanathan', phone: '+91 98200 44321', email: 'hospitalorders@cipla.com', address: 'Peninsula Business Park, Lower Parel, Mumbai', leadTime: 2 },
      { id: 'supp-himedia', name: 'HiMedia Clinical Diagnostics & Labs', contact: 'Dr. S. K. Roy', phone: '+91 98330 99887', email: 'reagents@himedialabs.com', address: 'A-516, Swastik Disha Corp Park, Mumbai', leadTime: 4 }
    ];
    for (const s of suppliers) {
      suppStmt.run(s.id, s.name, s.contact, s.phone, s.email, s.address, s.leadTime);
    }

    // 11. Inventory Items (120 clinical SKUs) & Batches (280+ batches)
    console.log('  Seeding 120 inventory catalog items and 280+ active/expiring batches...');
    const itemStmt = db.prepare(`
      INSERT INTO inventory_items (id, code, name, category, unit, min_stock, ward_id, supplier_id, cost_per_unit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const batchStmt = db.prepare(`
      INSERT INTO inventory_batches (id, item_id, batch_number, quantity, initial_quantity, expiry_date, purchase_date, cost_per_unit, location_bin, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const wardInvStmt = db.prepare(`INSERT INTO ward_inventory (id, ward_id, item_id, quantity) VALUES (?, ?, ?, ?)`);

    const rawCatalog = [
      // Pharmaceuticals
      { code: 'IV-NS-500', name: 'Normal Saline 0.9% IV (500ml Ecoflac)', cat: 'Pharmaceuticals', unit: 'Bottles', min: 80, cost: 42.50, desc: 'Isotonic crystalloid fluid resuscitation' },
      { code: 'IV-RL-500', name: 'Ringer Lactate Infusion (500ml)', cat: 'Pharmaceuticals', unit: 'Bottles', min: 60, cost: 48.00, desc: 'Balanced electrolyte solution for surgical hydration' },
      { code: 'IV-D5W-500', name: 'Dextrose 5% in Water (500ml)', cat: 'Pharmaceuticals', unit: 'Bottles', min: 50, cost: 40.00, desc: 'Isotonic carbohydrate infusion solution' },
      { code: 'IV-DNS-500', name: 'Dextrose Normal Saline (500ml)', cat: 'Pharmaceuticals', unit: 'Bottles', min: 50, cost: 44.00, desc: 'Maintenance intravenous rehydration fluid' },
      { code: 'IV-MAN-100', name: 'Mannitol 20% Infusion (100ml)', cat: 'Pharmaceuticals', unit: 'Bottles', min: 30, cost: 95.00, desc: 'Osmotic diuretic for elevated intracranial pressure' },
      { code: 'PHARM-PCM-IV', name: 'Paracetamol Infusion 10mg/ml (100ml IV)', cat: 'Pharmaceuticals', unit: 'Vials', min: 50, cost: 85.00, desc: 'Analgesic and antipyretic for acute pain/fever' },
      { code: 'PHARM-CEFT-1G', name: 'Ceftriaxone Injection 1g Vial with WFI', cat: 'Pharmaceuticals', unit: 'Vials', min: 40, cost: 72.00, desc: 'Third-gen cephalosporin broad-spectrum antibiotic' },
      { code: 'PHARM-PIPTAZ', name: 'Piperacillin + Tazobactam 4.5g Injection', cat: 'Pharmaceuticals', unit: 'Vials', min: 35, cost: 380.00, desc: 'Extended spectrum penicillin for severe sepsis' },
      { code: 'PHARM-MER-1G', name: 'Meropenem Trihydrate 1g Injection', cat: 'Pharmaceuticals', unit: 'Vials', min: 25, cost: 820.00, desc: 'Carbapenem antibiotic for multidrug-resistant infections' },
      { code: 'PHARM-PANT-40', name: 'Pantoprazole 40mg IV Injection', cat: 'Pharmaceuticals', unit: 'Vials', min: 60, cost: 52.00, desc: 'Proton pump inhibitor for gastroprotection' },
      { code: 'PHARM-ONDA-4', name: 'Ondansetron 2mg/ml (4mg/2ml Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 70, cost: 18.00, desc: 'Antiemetic for post-operative/chemo nausea' },
      { code: 'PHARM-TRAM-100', name: 'Tramadol HCl 50mg/ml (100mg/2ml Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 40, cost: 32.00, desc: 'Centrally acting analgesic for moderate/severe pain' },
      { code: 'PHARM-NORAD-4', name: 'Noradrenaline Bitartrate 2mg/ml (4mg Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 30, cost: 110.00, desc: 'Vasopressor in septic and vasodilatory shock' },
      { code: 'PHARM-ADR-1', name: 'Adrenaline / Epinephrine 1:1000 (1mg Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 50, cost: 22.00, desc: 'Resuscitation vasopressor and anaphylaxis therapy' },
      { code: 'PHARM-ATROP-06', name: 'Atropine Sulfate 0.6mg/ml Ampoule', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 45, cost: 14.00, desc: 'Anticholinergic for symptomatic bradycardia' },
      { code: 'PHARM-FURO-20', name: 'Furosemide 10mg/ml (20mg/2ml Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 50, cost: 16.00, desc: 'Loop diuretic for acute pulmonary edema' },
      { code: 'PHARM-HEPAR-5K', name: 'Heparin Sodium 5000 IU/ml (5ml Vial)', cat: 'Pharmaceuticals', unit: 'Vials', min: 30, cost: 240.00, desc: 'Anticoagulant for line locks and DVT prophylaxis' },
      { code: 'PHARM-INS-REG', name: 'Human Regular Insulin 40 IU/ml (10ml Vial)', cat: 'Pharmaceuticals', unit: 'Vials', min: 25, cost: 190.00, desc: 'Short-acting insulin for glycemic sliding scale' },
      { code: 'PHARM-POT-CHL', name: 'Potassium Chloride 15% (20mEq/10ml Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 40, cost: 28.00, desc: 'High-alert electrolyte concentrate for hypokalemia' },
      { code: 'PHARM-MIDAZ-5', name: 'Midazolam 1mg/ml (5mg/5ml Ampoule)', cat: 'Pharmaceuticals', unit: 'Ampoules', min: 20, cost: 65.00, desc: 'Sedative-hypnotic for procedural sedation' },
      // Consumables
      { code: 'DISP-SYR-02', name: 'Single Use Luer Lock Syringes with Needle (2ml)', cat: 'Consumables', unit: 'Pieces', min: 200, cost: 4.50, desc: 'Sterile injection administration' },
      { code: 'DISP-SYR-05', name: 'Single Use Luer Lock Syringes with Needle (5ml)', cat: 'Consumables', unit: 'Pieces', min: 250, cost: 6.50, desc: 'Standard clinical med reconstitution' },
      { code: 'DISP-SYR-10', name: 'Single Use Luer Lock Syringes with Needle (10ml)', cat: 'Consumables', unit: 'Pieces', min: 150, cost: 8.50, desc: 'IV push medications and flush' },
      { code: 'DISP-SYR-50', name: 'Perfusion Syringes for Syringe Pump (50ml)', cat: 'Consumables', unit: 'Pieces', min: 60, cost: 42.00, desc: 'Targeted syringe pump delivery' },
      { code: 'CONS-IVSET-STD', name: 'Vented IV Infusion Line with Roller Clamp', cat: 'Consumables', unit: 'Pieces', min: 100, cost: 28.00, desc: 'Gravity intravenous fluid administration set' },
      { code: 'CONS-IVSET-MICRO', name: 'Micro-Drip Pediatric Infusion Set (60 drops/ml)', cat: 'Consumables', unit: 'Pieces', min: 50, cost: 58.00, desc: 'Pediatric volumetric fluid line' },
      { code: 'CONS-IV-3WAY', name: 'Three-Way Stopcock with Extension Line (10cm)', cat: 'Consumables', unit: 'Pieces', min: 80, cost: 34.00, desc: 'Multi-infusion manifold junction' },
      { code: 'CANN-18G-GRN', name: 'IV Cannula with Injection Port (18G Green)', cat: 'Consumables', unit: 'Pieces', min: 60, cost: 35.00, desc: 'Rapid fluid resuscitation and blood transfusion' },
      { code: 'CANN-20G-PNK', name: 'IV Cannula with Injection Port (20G Pink)', cat: 'Consumables', unit: 'Pieces', min: 100, cost: 35.00, desc: 'General inpatient adult peripheral access' },
      { code: 'CANN-22G-BLU', name: 'IV Cannula with Injection Port (22G Blue)', cat: 'Consumables', unit: 'Pieces', min: 80, cost: 35.00, desc: 'Elderly and fragile peripheral venous access' },
      { code: 'CANN-24G-YEL', name: 'IV Cannula with Injection Port (24G Yellow)', cat: 'Consumables', unit: 'Pieces', min: 60, cost: 38.00, desc: 'Pediatric and neonatal peripheral cannulation' },
      { code: 'CONS-FOL-14', name: 'Two-Way Foley Catheter Silicone-Coated (14Fr)', cat: 'Consumables', unit: 'Pieces', min: 40, cost: 95.00, desc: 'Indwelling urinary drainage' },
      { code: 'CONS-FOL-16', name: 'Two-Way Foley Catheter Silicone-Coated (16Fr)', cat: 'Consumables', unit: 'Pieces', min: 50, cost: 95.00, desc: 'Adult male/female urinary catheterization' },
      { code: 'CONS-URO-2L', name: 'Closed System Urine Drainage Bag with Meter (2L)', cat: 'Consumables', unit: 'Pieces', min: 60, cost: 78.00, desc: 'Anti-reflux valve urine collection' },
      { code: 'CONS-NG-16', name: 'Ryles Nasogastric Enteral Feeding Tube (16Fr)', cat: 'Consumables', unit: 'Pieces', min: 35, cost: 65.00, desc: 'Gastric decompression and enteral nutrition' },
      { code: 'CONS-SUCT-14', name: 'Sterile Yankauer Suction Cannula with Tubing', cat: 'Consumables', unit: 'Pieces', min: 45, cost: 82.00, desc: 'Oropharyngeal secretion clearance' },
      { code: 'CONS-MICROPORE', name: '3M Micropore Surgical Paper Tape (2 inch)', cat: 'Consumables', unit: 'Rolls', min: 50, cost: 48.00, desc: 'Hypoallergenic dressing fixation tape' },
      { code: 'CONS-ALCO-SWAB', name: 'Sterile 70% Isopropyl Alcohol Prep Swabs', cat: 'Consumables', unit: 'Boxes', min: 40, cost: 120.00, desc: 'Box of 100 sterile skin disinfection wipes' },
      { code: 'CONS-TEGADERM', name: '3M Tegaderm IV Transparent Film Dressing', cat: 'Consumables', unit: 'Packs', min: 50, cost: 165.00, desc: 'Box of 50 sterile securement dressings' },
      { code: 'CONS-ECG-ELECT', name: 'Disposable Solid Gel Adult ECG Electrodes', cat: 'Consumables', unit: 'Packs', min: 30, cost: 210.00, desc: 'Pack of 50 monitoring electrodes' },
      // Surgical & Wound Care
      { code: 'SURG-GLV-65', name: 'Sterile Surgical Latex Gloves (Powder-Free, 6.5)', cat: 'Surgical', unit: 'Pairs', min: 80, cost: 32.00, desc: 'Aseptic surgical and invasive procedures' },
      { code: 'SURG-GLV-70', name: 'Sterile Surgical Latex Gloves (Powder-Free, 7.0)', cat: 'Surgical', unit: 'Pairs', min: 120, cost: 32.00, desc: 'Aseptic surgical hand barrier' },
      { code: 'SURG-GLV-75', name: 'Sterile Surgical Latex Gloves (Powder-Free, 7.5)', cat: 'Surgical', unit: 'Pairs', min: 120, cost: 32.00, desc: 'Standard operating glove size' },
      { code: 'SURG-GLV-80', name: 'Sterile Surgical Latex Gloves (Powder-Free, 8.0)', cat: 'Surgical', unit: 'Pairs', min: 80, cost: 32.00, desc: 'Large surgical hand barrier' },
      { code: 'SURG-GAUZ-SWB', name: 'Sterile Gauze Swabs 10cm x 10cm (Pack of 5)', cat: 'Surgical', unit: 'Packs', min: 100, cost: 24.00, desc: '100% absorbent cotton surgical packing' },
      { code: 'SURG-BAND-ELAS', name: 'High-Elastic Compression Bandage (15cm x 4m)', cat: 'Surgical', unit: 'Rolls', min: 40, cost: 65.00, desc: 'Orthopedic sprain and stump wrapping' },
      { code: 'SURG-DRS-PK', name: 'Pre-Sterilized Disposable Wound Dressing Pack', cat: 'Surgical', unit: 'Packs', min: 60, cost: 145.00, desc: 'Tray, forceps, cotton balls, gauze, drape' },
      { code: 'SURG-BETAD-500', name: 'Povidone Iodine 10% Antiseptic Solution (500ml)', cat: 'Surgical', unit: 'Bottles', min: 30, cost: 180.00, desc: 'Pre-operative and wound microbicide' },
      { code: 'SURG-H2O2-500', name: 'Hydrogen Peroxide 3% Solution (400ml)', cat: 'Surgical', unit: 'Bottles', min: 25, cost: 42.00, desc: 'Wound debridement and effervescent clean' },
      { code: 'SURG-SUT-20-VIC', name: 'Vicryl Polyglactin 910 Suture 2-0 Curved Needle', cat: 'Surgical', unit: 'Boxes', min: 15, cost: 1450.00, desc: 'Braided absorbable surgical suture' },
      { code: 'SURG-BLADE-11', name: 'Carbon Steel Surgical Scalpel Blades #11', cat: 'Surgical', unit: 'Boxes', min: 20, cost: 280.00, desc: 'Box of 100 sterile stab-incision blades' },
      { code: 'SURG-DRAIN-JP', name: 'Jackson-Pratt Silicone Wound Suction Bulb (100ml)', cat: 'Surgical', unit: 'Pieces', min: 25, cost: 420.00, desc: 'Closed suction drain reservoir with flat tube' },
      // PPE
      { code: 'PPE-MASK-3PLY', name: 'Fluid Resistant 3-Ply Surgical Face Mask', cat: 'PPE', unit: 'Boxes', min: 50, cost: 110.00, desc: 'Box of 100 melt-blown filter surgical masks' },
      { code: 'PPE-MASK-N95', name: 'N95 Particulate Respirator Mask (NIOSH Certified)', cat: 'PPE', unit: 'Pieces', min: 80, cost: 45.00, desc: 'Aerosol precautions in ICU/Emergency' },
      { code: 'PPE-GLV-NIT-M', name: 'Powder-Free Examination Nitrile Gloves (Medium)', cat: 'PPE', unit: 'Boxes', min: 70, cost: 260.00, desc: 'Box of 100 non-sterile examination gloves' },
      { code: 'PPE-GLV-NIT-L', name: 'Powder-Free Examination Nitrile Gloves (Large)', cat: 'PPE', unit: 'Boxes', min: 60, cost: 260.00, desc: 'Box of 100 chemical-resistant gloves' },
      { code: 'PPE-GOWN-DISP', name: 'Full Coverage Fluid Impervious Isolation Gown', cat: 'PPE', unit: 'Pieces', min: 100, cost: 75.00, desc: 'Contact isolation protective apron/gown' },
      { code: 'PPE-SHIELD-VIS', name: 'Anti-Fog Full Face Visor Shield', cat: 'PPE', unit: 'Pieces', min: 40, cost: 65.00, desc: 'Eye and droplet splatter protection' },
      { code: 'PPE-CAP-DISP', name: 'Non-Woven Bouffant Surgeon Caps (Pack of 100)', cat: 'PPE', unit: 'Packs', min: 30, cost: 95.00, desc: 'Sanitary head cover for sterile areas' },
      { code: 'PPE-SHOE-DISP', name: 'Disposable Skid-Resistant Shoe Covers', cat: 'PPE', unit: 'Packs', min: 40, cost: 85.00, desc: 'Pack of 100 anti-static floor protection covers' },
      // Medical Equipment & Diagnostics
      { code: 'EQUIP-PULSE-OXI', name: 'Finger Tip Fingertip Pulse Oximeter OLED', cat: 'Equipment', unit: 'Pieces', min: 10, cost: 850.00, desc: 'Bedside SpO2 and pulse rate screening' },
      { code: 'EQUIP-BP-CUFF', name: 'Adult Blood Pressure Monitor Nylon Cuff (Latex-Free)', cat: 'Equipment', unit: 'Pieces', min: 15, cost: 340.00, desc: 'Replacement cuff for multiparameter monitor' },
      { code: 'EQUIP-GLUCO-STRIP', name: 'Accu-Chek Blood Glucose Test Strips', cat: 'Equipment', unit: 'Boxes', min: 40, cost: 620.00, desc: 'Box of 50 biosensor glucose strips' },
      { code: 'EQUIP-NEB-KIT', name: 'Disposable Aerosol Mask & Nebulizer Chamber', cat: 'Equipment', unit: 'Pieces', min: 50, cost: 68.00, desc: 'Bronchodilator inhalation delivery circuit' },
      { code: 'EQUIP-VENT-CIRCUIT', name: 'Adult Dual-Limb Heated Ventilator Breathing Circuit', cat: 'Equipment', unit: 'Pieces', min: 20, cost: 980.00, desc: 'Smoothbore ICU ventilator circuit with water traps' },
      { code: 'EQUIP-AMBU-ADULT', name: 'Silicone Manual Resuscitator Ambu Bag (Adult 1500ml)', cat: 'Equipment', unit: 'Pieces', min: 8, cost: 1650.00, desc: 'Emergency manual ventilation bag with reservoir' },
      { code: 'EQUIP-DEFIB-PAD', name: 'Adult Multifunction Defibrillator Therapy Electrodes', cat: 'Equipment', unit: 'Packs', min: 12, cost: 1850.00, desc: 'Biphasic pacing and defibrillation pads' }
    ];

    // Expand items with realistic variations to reach 100+ SKUs
    const expandedCatalog = [...rawCatalog];
    const itemPrefixes = ['Pediatric', 'Neonatal', 'Reinforced', 'High-Flow', 'Antimicrobial', 'Ultra-Fine'];
    for (let i = 0; i < 55; i++) {
      const base = rawCatalog[i % rawCatalog.length];
      const prefix = itemPrefixes[i % itemPrefixes.length];
      expandedCatalog.push({
        code: `${base.code}-X${i + 1}`,
        name: `${prefix} ${base.name}`,
        cat: base.cat,
        unit: base.unit,
        min: Math.floor(base.min * 0.7),
        cost: Math.round(base.cost * 1.15 * 100) / 100,
        desc: `${prefix} variant: ${base.desc}`
      });
    }

    const insertedItems: any[] = [];
    let batchCounter = 100;

    for (const item of expandedCatalog) {
      const id = `inv-${item.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const supp = suppliers[(batchCounter * 7) % suppliers.length].id;
      const targetWard = (batchCounter % 4 === 0) ? null : wardKeys[batchCounter % wardKeys.length];

      itemStmt.run(id, item.code, item.name, item.cat, item.unit, item.min, targetWard, supp, item.cost, item.desc);
      insertedItems.push({ id, code: item.code, name: item.name, min: item.min, cost: item.cost, unit: item.unit });

      // Create 2 to 3 batches per item
      const numBatches = (batchCounter % 3 === 0) ? 3 : 2;
      let totalItemQty = 0;

      for (let b = 1; b <= numBatches; b++) {
        const batchId = crypto.randomUUID();
        const batchNo = `${item.code.slice(0, 4)}-B${batchCounter}`;
        batchCounter++;

        // Status variations: some healthy (2027-2028), some near-expiry (<60d), some low stock, some expired
        let expDate = '2027-11-30';
        let status = 'ACTIVE';
        let qty = Math.floor(item.min * (1.2 + (batchCounter % 3) * 0.8));

        if (batchCounter % 15 === 0) {
          // Near expiry (next 25 days)
          expDate = new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0];
          status = 'ACTIVE';
        } else if (batchCounter % 28 === 0) {
          // Expired (15 days ago)
          expDate = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0];
          status = 'EXPIRED';
        } else if (batchCounter % 9 === 0) {
          // Low stock
          qty = Math.max(2, Math.floor(item.min * 0.3));
        }

        batchStmt.run(
          batchId,
          id,
          batchNo,
          qty,
          qty + 50,
          expDate,
          '2026-01-10',
          item.cost,
          `Aisle ${(batchCounter % 5) + 1} - Shelf ${(batchCounter % 8) + 1}`,
          status
        );

        totalItemQty += qty;
      }

      if (targetWard) {
        wardInvStmt.run(crypto.randomUUID(), targetWard, id, Math.floor(totalItemQty * 0.4));
      }
    }

    // 12. Inventory Transactions (1,200+ transactions over past 60 days)
    console.log('  Seeding 1,200+ inventory ledger transactions...');
    const txnStmt = db.prepare(`
      INSERT INTO inventory_transactions (id, item_id, batch_id, type, quantity, source, destination, reason, ward_id, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const txnTypes = ['ISSUED', 'ISSUED', 'RECEIVED', 'ISSUED', 'RETURNED', 'ADJUSTED'];
    for (let t = 1; t <= 1250; t++) {
      const item = insertedItems[t % insertedItems.length];
      const type = txnTypes[t % txnTypes.length];
      const ward = wardKeys[t % wardKeys.length];
      const user = allUsers[t % allUsers.length].id;
      const daysOffset = (t % 60);
      const hoursOffset = (t * 7) % 24;
      const txnDate = new Date(Date.now() - (daysOffset * 24 + hoursOffset) * 3600 * 1000).toISOString();
      const qty = 5 + (t % 35);

      txnStmt.run(
        crypto.randomUUID(),
        item.id,
        null,
        type,
        qty,
        type === 'RECEIVED' ? 'Central Supplier Consignment' : 'Central Pharmacy Store',
        type === 'ISSUED' ? wards.find(w => w.id === ward)?.name : 'Central Pharmacy Store',
        type === 'ISSUED' ? 'Ward stock replenishment indent' : (type === 'RECEIVED' ? 'Supplier PO Receipt' : 'Audit reconciliation variance'),
        ward,
        user,
        txnDate
      );
    }

    // 13. Stock Requests (120+ ward indents)
    console.log('  Seeding 120+ clinical ward stock requisitions...');
    const reqStmt = db.prepare(`
      INSERT INTO stock_requests (id, request_no, ward_id, requested_by, status, urgency, notes, reviewed_by, review_comment, reviewed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const reqItemStmt = db.prepare(`
      INSERT INTO stock_request_items (id, request_id, item_id, quantity_requested, quantity_approved, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const reqStatuses = ['Fulfilled', 'Approved', 'Pending', 'Pending', 'Rejected', 'Partially Approved'];
    const urgencies = ['Routine', 'Urgent', 'Emergency', 'Routine'];

    for (let r = 1; r <= 125; r++) {
      const reqId = crypto.randomUUID();
      const reqNo = `REQ-2026-${String(r).padStart(4, '0')}`;
      const ward = wardKeys[r % wardKeys.length];
      const requester = allUsers.filter(u => u.role === 'role-nurse')[r % 40].id;
      const status = reqStatuses[r % reqStatuses.length];
      const urgency = urgencies[r % urgencies.length];
      const reviewer = (status !== 'Pending') ? 'usr-rajesh' : null;
      const daysAgo = (r % 25);
      const createdDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString();
      const reviewedDate = (status !== 'Pending') ? new Date(Date.now() - (daysAgo - 0.2) * 24 * 3600 * 1000).toISOString() : null;

      reqStmt.run(
        reqId,
        reqNo,
        ward,
        requester,
        status,
        urgency,
        `Shift consumption restock for ${wards.find(w => w.id === ward)?.name}. Inpatient surge noted.`,
        reviewer,
        reviewer ? `Reviewed and processed: status set to ${status}.` : null,
        reviewedDate,
        createdDate
      );

      // Add 2 items per request
      const item1 = insertedItems[(r * 3) % insertedItems.length];
      const item2 = insertedItems[(r * 5) % insertedItems.length];
      const q1 = 15 + (r % 25);
      const q2 = 10 + (r % 20);

      reqItemStmt.run(crypto.randomUUID(), reqId, item1.id, q1, status === 'Fulfilled' || status === 'Approved' ? q1 : 0, 'High inpatient census requirement');
      reqItemStmt.run(crypto.randomUUID(), reqId, item2.id, q2, status === 'Fulfilled' || status === 'Approved' ? q2 : 0, 'Safety reserve top-up');
    }

    // 14. Tasks (750+ clinical care tasks across all wards)
    console.log('  Seeding 750+ linked clinical tasks, activity timelines and nursing comments...');
    const taskStmt = db.prepare(`
      INSERT INTO tasks (
        id, title, description, category_id, ward_id, assigned_to, created_by,
        priority, status, due_date, recurrence, patient_reference, instructions,
        completion_notes, completed_at, completed_by, escalated, escalated_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const commentStmt = db.prepare(`INSERT INTO task_comments (id, task_id, user_id, comment, created_at) VALUES (?, ?, ?, ?, ?)`);
    const historyStmt = db.prepare(`INSERT INTO task_history (id, task_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`);

    const taskTemplates = [
      { title: 'Administer IV Ceftriaxone 1g slow infusion', cat: 'cat-med', prio: 'Urgent', desc: 'Patient admitted with post-operative fever spike (101.4 F). Blood cultures sent.', inst: 'Infuse over 30 mins in 100ml NS. Monitor for rash or signs of hypersensitivity.' },
      { title: 'Hourly Arterial Blood Gas (ABG) & Ventilator Weaning Check', cat: 'cat-vitals', prio: 'High', desc: 'Intubated patient on Pressure Support mode. Assess PaO2/FiO2 ratio and spontaneous tidal volumes.', inst: 'Collect from left radial A-line after flushing. Deliver on crushed ice to ICU lab STAT.' },
      { title: 'Aseptic Laparotomy Wound Dressing & Jackson-Pratt Drain Check', cat: 'cat-wound', prio: 'Medium', desc: 'Day 3 post exploratory laparotomy. Observe serosanguinous output and record drain volume.', inst: 'Sterile Betadine & normal saline clean. Count swabs. Re-clamp suction bulb with active negative pressure.' },
      { title: 'Crash Cart Defibrillator & Emergency Meds Daily Audit', cat: 'cat-equip', prio: 'High', desc: 'Mandatory start-of-shift inspection of resuscitation equipment and pediatric paddles.', inst: 'Perform 30-Joule test discharge on tester load. Verify laryngoscope bulbs, Ambu bag, and Epinephrine expiry.' },
      { title: 'STAT 12-Lead ECG for Acute Chest Discomfort', cat: 'cat-vitals', prio: 'Urgent', desc: 'Patient complaining of sub-sternal heaviness radiating to left shoulder. BP 150/94.', inst: 'Run 12-lead ECG, keep machine calibrated at 25mm/s. Notify on-duty cardiology resident immediately.' },
      { title: 'Capillary Blood Glucose (CBG) & Sliding Scale Insulin', cat: 'cat-vitals', prio: 'Medium', desc: 'Type 2 Diabetic on steroid therapy. Target pre-meal glucose 140-180 mg/dL.', inst: 'Check glucometer reading prior to meal. If >200 mg/dL, administer 4 units Regular Human Insulin SubQ.' },
      { title: 'Terminal Disinfection & Bed Sterilization post discharge', cat: 'cat-disinfect', prio: 'Medium', desc: 'Bed vacated following MRSA negative swab. Perform full deep disinfection protocol.', inst: 'Use 0.5% Sodium Hypochlorite on hard surfaces. Change all ventilator tubing and curtains.' },
      { title: 'Urgent Packed Red Blood Cells (PRBC) Crossmatch & Transfusion', cat: 'cat-med', prio: 'Urgent', desc: 'Post-op hemoglobin dropped to 6.8 g/dL with tachycardia. 2 units PRBC ordered.', inst: 'Double-check blood unit bag label with second RN. Pre-transfusion vitals. Infuse initial 50ml at slow rate.' },
      { title: 'Pre-operative Fasting & Chlorhexidine Skin Wash Verification', cat: 'cat-care', prio: 'Low', desc: 'Scheduled for Total Knee Arthroplasty tomorrow at 08:30. NPO from 24:00 midnight.', inst: 'Confirm NPO signage at bedside. Ensure Hibiscrub full body shower taken. Consent form signed.' },
      { title: 'Indwelling Foley Catheter Replacement & Urine Analysis', cat: 'cat-proc', prio: 'High', desc: 'Indwelling Foley in place for 14 days. Routine replacement and urine culture collection.', inst: 'Use silicone 16Fr Foley with sterile catheterization tray. Obtain midstream sample from sampling port.' },
      { title: 'Central Venous Pressure (CVP) Line Dressing Change', cat: 'cat-wound', prio: 'High', desc: 'Right internal jugular triple lumen catheter day 5. Prevent CLABSI.', inst: 'Chlorhexidine skin prep 30s dry time. Apply sterile transparent semipermeable dressing with biopatch.' },
      { title: 'Patient 2-Hourly Q2H Repositioning & Pressure Ulcer Skin Inspection', cat: 'cat-care', prio: 'Medium', desc: 'Braden scale score 12 (High risk). Patient bedridden following acute ischemic stroke.', inst: 'Reposition to 30 deg left lateral tilt with foam wedge support. Inspect sacrum and bilateral trochanters.' },
      { title: 'Nebulization with Levosalbutamol + Budesonide Respules', cat: 'cat-med', prio: 'Medium', desc: 'Patient with acute wheezing and bilateral expiratory rhonchi in general ward.', inst: 'Administer via oxygen mask driven nebulizer at 6-8 L/min. Re-assess respiratory rate and SpO2 in 15 mins.' },
      { title: 'Serum Electrolytes & Renal Function Test STAT Blood Draw', cat: 'cat-lab', prio: 'High', desc: 'Patient on high dose loop diuretic infusion. Serum potassium check required.', inst: 'Draw 3ml blood in red-top clot activator vial and 2ml in green-top heparin vial. Send to central lab.' },
      { title: 'Assisted Ambulation & Deep Vein Thrombosis (DVT) Pump Check', cat: 'cat-care', prio: 'Low', desc: 'Post-op Day 1 elective spine decompression. Early mobilization protocol.', inst: 'Check bilateral sequential compression device (SCD) sleeves functioning. Assist to sit at edge of bed.' }
    ];

    const taskStatuses = ['Completed', 'Completed', 'In Progress', 'Pending', 'Pending', 'Overdue'];
    const nurseUsers = allUsers.filter(u => u.role === 'role-nurse');
    const supUsers = allUsers.filter(u => u.role === 'role-supervisor');

    for (let t = 1; t <= 750; t++) {
      const tpl = taskTemplates[t % taskTemplates.length];
      const taskId = `task-${t}`;
      const patient = allPatients[t % allPatients.length];
      const wardId = patient.wardId;
      const assignedNurse = nurseUsers[t % nurseUsers.length].id;
      const creatorSupervisor = supUsers[t % supUsers.length].id;

      // Ensure some tasks are assigned to primary demo accounts for instant evaluation
      const finalAssignee = (t <= 20) ? 'usr-priya' : (t <= 35 ? 'usr-mary' : (t <= 50 ? 'usr-ananya' : assignedNurse));
      const status = taskStatuses[t % taskStatuses.length];

      // Realistic deadlines: some past (overdue or completed), some upcoming today/tomorrow
      let hoursFromNow = 0;
      let isCompleted = status === 'Completed';
      let isOverdue = status === 'Overdue';

      if (isCompleted) {
        hoursFromNow = -((t % 48) + 2); // completed in past 2 days
      } else if (isOverdue) {
        hoursFromNow = -((t % 12) + 1); // overdue by 1 to 12 hours
      } else {
        hoursFromNow = (t % 24) + 1; // due in next 1 to 24 hours
      }

      const dueDate = new Date(Date.now() + hoursFromNow * 3600 * 1000).toISOString();
      const createdDate = new Date(Date.now() + (hoursFromNow - 6) * 3600 * 1000).toISOString();
      const completedAt = isCompleted ? new Date(Date.now() + (hoursFromNow + 1) * 3600 * 1000).toISOString() : null;
      const isEscalated = (t % 18 === 0 && !isCompleted) ? 1 : 0;
      const escalatedReason = isEscalated ? 'Patient clinical parameters deteriorating / delayed drug delivery from pharmacy. Escalated to shift in-charge.' : null;

      taskStmt.run(
        taskId,
        tpl.title,
        tpl.desc,
        tpl.cat,
        wardId,
        finalAssignee,
        creatorSupervisor,
        tpl.prio,
        isOverdue ? 'Pending' : status, // Overdue is dynamically computed by status != Completed and due_date < now
        dueDate,
        'NONE',
        `${patient.bed} - ${patient.name} (${patient.uhid})`,
        tpl.inst,
        isCompleted ? 'Procedure performed aseptically according to hospital protocol. Vitals stable.' : null,
        completedAt,
        isCompleted ? finalAssignee : null,
        isEscalated,
        escalatedReason,
        createdDate
      );

      historyStmt.run(
        crypto.randomUUID(),
        taskId,
        creatorSupervisor,
        'TASK_CREATED',
        `Task assigned to ${allUsers.find(u => u.id === finalAssignee)?.name} with priority ${tpl.prio}`,
        createdDate
      );

      if (isCompleted) {
        historyStmt.run(
          crypto.randomUUID(),
          taskId,
          finalAssignee,
          'STATUS_CHANGED',
          'Task status updated to Completed with sign-off documentation',
          completedAt
        );
      }

      // Add realistic comment on some tasks
      if (t % 4 === 0) {
        commentStmt.run(
          crypto.randomUUID(),
          taskId,
          creatorSupervisor,
          'Please ensure vitals are logged in clinical register immediately following execution.',
          createdDate
        );
      }
    }

    // 15. Digital Register Entries (600+ clinical records across all 9 registers)
    console.log('  Seeding 600+ non-destructive digital register records with version history...');
    const regEntryStmt = db.prepare(`
      INSERT INTO register_entries (id, register_code, ward_id, user_id, date, data_json, status, current_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const regHistoryStmt = db.prepare(`
      INSERT INTO register_entry_history (id, entry_id, version, user_id, data_json, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const regCodes = regTemplates.map(t => t.code);
    for (let e = 1; e <= 600; e++) {
      const code = regCodes[e % regCodes.length];
      const entryId = `reg-entry-${e}`;
      const patient = allPatients[e % allPatients.length];
      const wardId = patient.wardId;
      const author = nurseUsers[e % nurseUsers.length].id;
      const daysAgo = e % 30;
      const entryDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().split('T')[0];

      let entryData: Record<string, any> = {};

      if (code === 'daily_nursing_activity') {
        entryData = {
          bedNo: patient.bed,
          patientName: patient.name,
          uhid: patient.uhid,
          diagnosis: 'Acute inpatient care',
          activityPerformed: 'Hourly vitals check, IV medication administration, skin integrity audit, doctor rounds assisted.',
          fluidIntakeOutput: 'Intake: 1800 ml | Output: 1450 ml (+350 ml)',
          doctorRoundsBy: attendingDoctors[e % attendingDoctors.length]
        };
      } else if (code === 'medication_administration') {
        entryData = {
          bedNo: patient.bed,
          patientName: patient.name,
          uhid: patient.uhid,
          medicationName: 'IV Ceftriaxone 1g in 100ml NS',
          dosage: '1g IV BD',
          route: 'IV Infusion',
          scheduledTime: '08:00',
          actualTimeGiven: '08:15',
          adverseReactions: 'No extravasation, no signs of hypersensitivity. Cannula patent.'
        };
      } else if (code === 'nursing_notes') {
        entryData = {
          bedNo: patient.bed,
          patientName: patient.name,
          uhid: patient.uhid,
          subjective: 'Patient reports mild incision pain (3/10 on VAS). Tolerating liquid diet well.',
          objective: 'Vitals: BP 124/78, PR 76, SpO2 99% on room air, Afebrile. Surgical dressing clean and dry.',
          assessment: 'Post-operative recovery progressing satisfactorily without active bleeding or tachycardia.',
          plan: 'Continue scheduled IV analgesics, encourage deep breathing and incentive spirometry Q2H.'
        };
      } else if (code === 'incident_report') {
        entryData = {
          incidentCategory: 'Medication Near-Miss/Error',
          severityLevel: 'Near-Miss (No Harm)',
          bedOrLocation: `${patient.bed} - ${wards.find(w => w.id === wardId)?.name}`,
          descriptionOfEvent: 'Dose concentration discrepancy caught during 5-rights bedside nursing check.',
          immediateActionTaken: 'Reconstitution halted. Pharmacy satellite notified and correct vial verified.',
          physicianInformedName: attendingDoctors[e % attendingDoctors.length]
        };
      } else {
        entryData = {
          bedNo: patient.bed,
          patientName: patient.name,
          uhid: patient.uhid,
          summaryNotes: 'Standard clinical documentation verified as per hospital standard operating procedure.',
          recordedBy: author
        };
      }

      const isAmended = (e % 15 === 0);
      const version = isAmended ? 2 : 1;
      const status = isAmended ? 'AMENDED' : 'FINAL';

      regEntryStmt.run(
        entryId,
        code,
        wardId,
        author,
        entryDate,
        JSON.stringify(entryData),
        status,
        version,
        new Date(Date.now() - (daysAgo * 24 + 4) * 3600 * 1000).toISOString()
      );

      // If amended, store previous version snapshot with clinical correction reason (Requirement 26, 33)
      if (isAmended) {
        const oldData = { ...entryData, fluidIntakeOutput: 'Intake: 1600 ml | Output: 1400 ml (+200 ml)' };
        regHistoryStmt.run(
          crypto.randomUUID(),
          entryId,
          1,
          author,
          JSON.stringify(oldData),
          'Corrected intake tally following evening fluid bag recalculation from IV infusion pump.',
          new Date(Date.now() - (daysAgo * 24 + 6) * 3600 * 1000).toISOString()
        );
      }
    }

    // 16. Shift Assignments & Staff Availability (90 days of duty roster = 1,200+ assignments)
    console.log('  Seeding 90 days of ward shift duty allocations...');
    const assignStmt = db.prepare(`
      INSERT INTO shift_assignments (id, shift_id, user_id, ward_id, date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const availStmt = db.prepare(`
      INSERT INTO staff_availability (id, user_id, date, status, reason)
      VALUES (?, ?, ?, ?, ?)
    `);

    const shiftCodes = ['shift-morn', 'shift-eve', 'shift-night'];
    const today = new Date().toISOString().split('T')[0];

    // Guarantee that our demo nurses are on duty today
    assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-priya', 'ward-micu', today, 'ON_DUTY', 'MICU Bed 1-6 Primary Care');
    assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-mary', 'ward-fsw', today, 'ON_DUTY', 'Surgical post-op bed allocation');
    assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-ananya', 'ward-etr', today, 'ON_DUTY', 'Triage resuscitation bay');
    assignStmt.run(crypto.randomUUID(), 'shift-morn', 'usr-deepa', 'ward-mmw', today, 'ON_DUTY', 'Medical ward medication rounds');
    assignStmt.run(crypto.randomUUID(), 'shift-eve', 'usr-priya', 'ward-micu', today, 'SCHEDULED', 'Ventilator weaning trial coverage');

    for (let day = -60; day <= 15; day++) {
      const dateStr = new Date(Date.now() + day * 24 * 3600 * 1000).toISOString().split('T')[0];
      const isPast = day < 0;
      const isToday = day === 0;

      for (let wIdx = 0; wIdx < wards.length; wIdx++) {
        const wardId = wards[wIdx].id;
        const assignedNurse = nurseUsers[(wIdx * 3 + Math.abs(day)) % nurseUsers.length].id;
        const shiftId = shiftCodes[(wIdx + Math.abs(day)) % shiftCodes.length];
        const status = isPast ? 'COMPLETED' : (isToday ? 'ON_DUTY' : 'SCHEDULED');

        assignStmt.run(
          crypto.randomUUID(),
          shiftId,
          assignedNurse,
          wardId,
          dateStr,
          status,
          `Inpatient duty roster allocation - ${wards[wIdx].name}`
        );
      }

      // Add occasional planned leave in staff availability
      if (day % 4 === 0) {
        const leaveNurse = nurseUsers[(Math.abs(day) * 7) % nurseUsers.length].id;
        availStmt.run(
          crypto.randomUUID(),
          leaveNurse,
          dateStr,
          'ON_LEAVE',
          'Approved clinical study leave / compensatory off'
        );
      }
    }

    // 17. Structured Handovers (250+ handovers over past 60 days)
    console.log('  Seeding 250+ structured ISBAR nursing handovers...');
    const handoverStmt = db.prepare(`
      INSERT INTO handovers (
        id, ward_id, shift_id, date, outgoing_nurse_id, incoming_nurse_id,
        status, notes, equipment_issues, unresolved_incidents, pending_task_ids,
        completed_at, acknowledged_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let h = 1; h <= 250; h++) {
      const ward = wardKeys[h % wardKeys.length];
      const shift = shiftCodes[h % shiftCodes.length];
      const outgoing = nurseUsers[h % nurseUsers.length].id;
      const incoming = nurseUsers[(h + 1) % nurseUsers.length].id;
      const daysAgo = h % 60;
      const hDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().split('T')[0];
      const isAcknowledged = h > 10;
      const status = isAcknowledged ? 'ACKNOWLEDGED' : (h % 3 === 0 ? 'INCOMPLETE' : 'PENDING_ACKNOWLEDGEMENT');

      const createdTime = new Date(Date.now() - (daysAgo * 24 + 2) * 3600 * 1000).toISOString();
      const ackTime = isAcknowledged ? new Date(Date.now() - (daysAgo * 24 + 1.5) * 3600 * 1000).toISOString() : null;

      handoverStmt.run(
        crypto.randomUUID(),
        ward,
        shift,
        hDate,
        outgoing,
        incoming,
        status,
        `Shift clinical handover in ${wards.find(w => w.id === ward)?.name}: All critical care lines patent. High alert infusions titrated as per doctor instructions.`,
        'Syringe pumps and vital monitors checked and calibrated. Biomedical tags verified.',
        'Zero medication omissions during current shift.',
        JSON.stringify([`task-${(h * 2) % 700 + 1}`, `task-${(h * 3) % 700 + 1}`]),
        createdTime,
        ackTime,
        createdTime
      );
    }

    // 18. In-App Notifications (550+ alerts across users)
    console.log('  Seeding 550+ in-app operational notifications...');
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, priority, link, is_read, is_acknowledged, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const notifTypes = ['TASK', 'SHIFT', 'HANDOVER', 'INVENTORY', 'ESCALATION', 'SYSTEM'];
    const notifPrios = ['Normal', 'High', 'Urgent'];

    // Give Priya (primary nurse) several actionable notifications
    notifStmt.run(
      crypto.randomUUID(),
      'usr-priya',
      'Urgent Task Assigned: IV Ceftriaxone 1g',
      'You have an urgent antibiotic administration due for Bed 4.',
      'TASK',
      'Urgent',
      '/tasks/task-1',
      0,
      0,
      new Date(Date.now() - 30 * 60 * 1000).toISOString()
    );
    notifStmt.run(
      crypto.randomUUID(),
      'usr-priya',
      'Incoming Shift Handover Awaiting Acknowledgment',
      'Outgoing shift handover report from Sister Mary is ready for your digital sign-off.',
      'HANDOVER',
      'High',
      '/handover',
      0,
      0,
      new Date(Date.now() - 45 * 60 * 1000).toISOString()
    );

    // Give Rajesh (inventory manager) stock alerts
    notifStmt.run(
      crypto.randomUUID(),
      'usr-rajesh',
      'Low Stock Warning: Normal Saline 0.9% (500ml)',
      'Current central store balance is below safe reorder threshold (38/80 Bottles remaining).',
      'INVENTORY',
      'High',
      '/inventory',
      0,
      0,
      new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    );
    notifStmt.run(
      crypto.randomUUID(),
      'usr-rajesh',
      'Batches Expiring Soon Alert (<30 Days)',
      '3 batches of Paracetamol IV and Surgical Gloves are expiring within 30 days.',
      'INVENTORY',
      'Urgent',
      '/inventory',
      0,
      0,
      new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    );

    for (let n = 1; n <= 550; n++) {
      const targetUser = allUsers[n % allUsers.length].id;
      const type = notifTypes[n % notifTypes.length];
      const prio = notifPrios[n % notifPrios.length];
      const isRead = (n % 4 !== 0) ? 1 : 0;
      const hoursAgo = n % 120;
      const createdDate = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

      notifStmt.run(
        crypto.randomUUID(),
        targetUser,
        `Clinical Alert: ${type} update notification`,
        `Automated notification event logged for record synchronization in clinical operations.`,
        type,
        prio,
        type === 'TASK' ? '/tasks' : (type === 'INVENTORY' ? '/inventory' : '/shifts'),
        isRead,
        0,
        createdDate
      );
    }

    // 19. System Audit Logs (1,200+ detailed forensic logs)
    console.log('  Seeding 1,200+ forensic system audit logs...');
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity, record_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const auditActions = [
      { action: 'USER_LOGIN', entity: 'AUTH' },
      { action: 'TASK_CREATED', entity: 'TASK' },
      { action: 'TASK_STATUS_UPDATED', entity: 'TASK' },
      { action: 'REGISTER_ENTRY_CREATED', entity: 'REGISTER' },
      { action: 'STOCK_ISSUED', entity: 'INVENTORY_TRANSACTION' },
      { action: 'STOCK_RECEIVED', entity: 'INVENTORY_TRANSACTION' },
      { action: 'STOCK_REQUEST_APPROVED', entity: 'STOCK_REQUEST' },
      { action: 'SHIFT_ASSIGNED', entity: 'SHIFT_ASSIGNMENT' },
      { action: 'HANDOVER_ACKNOWLEDGED', entity: 'HANDOVER' }
    ];

    for (let a = 1; a <= 1250; a++) {
      const act = auditActions[a % auditActions.length];
      const user = allUsers[a % allUsers.length].id;
      const hoursAgo = (a % 168); // past 7 days
      const createdDate = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

      auditStmt.run(
        crypto.randomUUID(),
        user,
        act.action,
        act.entity,
        `REC-${10000 + a}`,
        JSON.stringify({ operation: act.action, verified: true, source: 'NurseFlow Clinical Service' }),
        `192.168.1.${100 + (a % 150)}`,
        createdDate
      );
    }
  });

  // Execute entire seed within the database transaction
  seedTransaction();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ NurseFlow Enterprise Hospital Dataset successfully seeded in ${elapsed}s!`);
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
