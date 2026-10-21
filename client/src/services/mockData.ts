import {
  User,
  Department,
  Ward,
  TaskCategory,
  Task,
  RegisterTemplate,
  RegisterEntry,
  InventoryItem,
  StockRequest,
  Shift,
  ShiftAssignment,
  StaffAvailability,
  Handover,
  InAppNotification,
  AuditLog
} from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-icu', code: 'ICU', name: 'Intensive Care Unit', description: 'Critical care, hemodynamic monitoring and ventilator support', ward_count: 2 },
  { id: 'dept-genmed', code: 'GENMED', name: 'General Medicine', description: 'Adult internal medicine, chronic disease management and inpatient acute care', ward_count: 3 },
  { id: 'dept-surg', code: 'SURG', name: 'General Surgery', description: 'Pre-operative and post-operative surgical inpatient care', ward_count: 2 },
  { id: 'dept-peds', code: 'PEDS', name: 'Pediatrics & Neonatology', description: 'Pediatric care and neonatal intermediate monitoring', ward_count: 1 },
  { id: 'dept-emrg', code: 'EMRG', name: 'Emergency & Trauma', description: '24/7 acute triage, resuscitation, and trauma resuscitation care', ward_count: 1 },
  { id: 'dept-ortho', code: 'ORTHO', name: 'Orthopedics & Joint Care', description: 'Musculoskeletal surgery and trauma post-op care', ward_count: 1 },
  { id: 'dept-admin', code: 'ADMIN', name: 'Hospital Administration & Pharmacy', description: 'Operations, nursing governance, central pharmacy and supply chain', ward_count: 0 },
];

export const INITIAL_WARDS: Ward[] = [
  { id: 'ward-micu', department_id: 'dept-icu', departmentId: 'dept-icu', department_name: 'Intensive Care Unit', name: 'Medical ICU (MICU)', code: 'MICU-01', floor: '3rd Floor - Block A', bed_capacity: 16, bedCapacity: 16, status: 'ACTIVE', active_staff_count: 8 },
  { id: 'ward-sicu', department_id: 'dept-icu', departmentId: 'dept-icu', department_name: 'Intensive Care Unit', name: 'Surgical ICU (SICU)', code: 'SICU-02', floor: '3rd Floor - Block B', bed_capacity: 14, bedCapacity: 14, status: 'ACTIVE', active_staff_count: 6 },
  { id: 'ward-mmw', department_id: 'dept-genmed', departmentId: 'dept-genmed', department_name: 'General Medicine', name: 'Male Medical Ward', code: 'MMW-03', floor: '2nd Floor - Block A', bed_capacity: 28, bedCapacity: 28, status: 'ACTIVE', active_staff_count: 7 },
  { id: 'ward-fmw', department_id: 'dept-genmed', departmentId: 'dept-genmed', department_name: 'General Medicine', name: 'Female Medical Ward', code: 'FMW-04', floor: '2nd Floor - Block B', bed_capacity: 26, bedCapacity: 26, status: 'ACTIVE', active_staff_count: 7 },
  { id: 'ward-fsw', department_id: 'dept-surg', departmentId: 'dept-surg', department_name: 'General Surgery', name: 'Female Surgical Ward', code: 'FSW-05', floor: '4th Floor - Block A', bed_capacity: 24, bedCapacity: 24, status: 'ACTIVE', active_staff_count: 5 },
  { id: 'ward-msw', department_id: 'dept-surg', departmentId: 'dept-surg', department_name: 'General Surgery', name: 'Male Surgical Ward', code: 'MSW-06', floor: '4th Floor - Block B', bed_capacity: 24, bedCapacity: 24, status: 'ACTIVE', active_staff_count: 5 },
  { id: 'ward-ped', department_id: 'dept-peds', departmentId: 'dept-peds', department_name: 'Pediatrics & Neonatology', name: 'Pediatric Care Ward', code: 'PED-07', floor: '1st Floor - Block C', bed_capacity: 20, bedCapacity: 20, status: 'ACTIVE', active_staff_count: 6 },
  { id: 'ward-etr', department_id: 'dept-emrg', departmentId: 'dept-emrg', department_name: 'Emergency & Trauma', name: 'Emergency Triage & Resuscitation', code: 'ETR-08', floor: 'Ground Floor', bed_capacity: 18, bedCapacity: 18, status: 'ACTIVE', active_staff_count: 9 },
  { id: 'ward-ortho', department_id: 'dept-ortho', departmentId: 'dept-ortho', department_name: 'Orthopedics & Joint Care', name: 'Orthopedic Post-Op Ward', code: 'OPOW-09', floor: '5th Floor - Block A', bed_capacity: 22, bedCapacity: 22, status: 'ACTIVE', active_staff_count: 5 },
  { id: 'ward-daycare', department_id: 'dept-genmed', departmentId: 'dept-genmed', department_name: 'General Medicine', name: 'Day Care & Infusion Center', code: 'DCIC-10', floor: 'Ground Floor - Wing B', bed_capacity: 15, bedCapacity: 15, status: 'ACTIVE', active_staff_count: 4 },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-hns-001',
    employeeId: 'NF-HNS-002',
    name: 'Sunita Rao',
    email: 'sunita.rao@nurseflow.local',
    role: 'Head Nurse / Supervisor',
    departmentId: 'dept-icu',
    departmentName: 'Intensive Care Unit',
    wardId: 'ward-micu',
    wardName: 'Medical ICU (MICU)',
    phone: '+91 98450 12345',
    qualification: 'M.Sc. Nursing (Critical Care)',
    registrationNo: 'KNC-RN-589201',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'usr-nrs-001',
    employeeId: 'NF-NUR-101',
    name: 'Priya Sharma',
    email: 'priya.sharma@nurseflow.local',
    role: 'Nurse',
    departmentId: 'dept-icu',
    departmentName: 'Intensive Care Unit',
    wardId: 'ward-micu',
    wardName: 'Medical ICU (MICU)',
    phone: '+91 98450 67890',
    qualification: 'B.Sc. Nursing, BLS/ACLS Certified',
    registrationNo: 'KNC-RN-784312',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'usr-inv-001',
    employeeId: 'NF-INV-001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@nurseflow.local',
    role: 'Inventory Manager',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration & Pharmacy',
    phone: '+91 98450 44556',
    qualification: 'M.Pharm (Hospital & Clinical Pharmacy)',
    registrationNo: 'PCI-REG-99412',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'usr-adm-001',
    employeeId: 'NF-ADM-001',
    name: 'Dr. Ramesh Hegde',
    email: 'admin@nurseflow.local',
    role: 'Administrator',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration & Pharmacy',
    phone: '+91 98450 11223',
    qualification: 'MD (Hospital Administration), MHA',
    registrationNo: 'MCI-REG-34011',
    status: 'ACTIVE',
    lastLogin: new Date().toISOString(),
  },
  // Alias accounts for organization domain
  {
    id: 'usr-hns-org',
    employeeId: 'EMP-HNS-001',
    name: 'Sister Sunita Rao',
    email: 'headnurse.icu@nurseflow.org',
    role: 'Head Nurse / Supervisor',
    departmentId: 'dept-icu',
    departmentName: 'Intensive Care Unit',
    wardId: 'ward-micu',
    wardName: 'Medical ICU (MICU)',
    status: 'ACTIVE',
  },
  {
    id: 'usr-nrs-org',
    employeeId: 'EMP-NRS-001',
    name: 'Nurse Sarah Jenkins',
    email: 'nurse.sarah@nurseflow.org',
    role: 'Nurse',
    departmentId: 'dept-icu',
    departmentName: 'Intensive Care Unit',
    wardId: 'ward-micu',
    wardName: 'Medical ICU (MICU)',
    status: 'ACTIVE',
  },
  {
    id: 'usr-inv-org',
    employeeId: 'EMP-INV-001',
    name: 'Rajesh Kumar (Lead Pharmacist)',
    email: 'pharmacy.lead@nurseflow.org',
    role: 'Inventory Manager',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration & Pharmacy',
    status: 'ACTIVE',
  },
  {
    id: 'usr-adm-org',
    employeeId: 'EMP-ADM-001',
    name: 'System Administrator',
    email: 'admin@nurseflow.org',
    role: 'Administrator',
    departmentId: 'dept-admin',
    departmentName: 'Hospital Administration & Pharmacy',
    status: 'ACTIVE',
  },
];

export const INITIAL_CATEGORIES: TaskCategory[] = [
  { id: 'cat-med', code: 'MED_ADMIN', name: 'Medication Administration', color: 'blue', icon: 'Pill', description: 'IV, oral, subcutaneous and infusion administration' },
  { id: 'cat-vitals', code: 'VITALS', name: 'Vitals & Monitoring', color: 'teal', icon: 'Activity', description: 'BP, Pulse, SpO2, Temperature and GCS recording' },
  { id: 'cat-wound', code: 'WOUND_CARE', name: 'Wound Dressing & Drain Care', color: 'amber', icon: 'Bandage', description: 'Surgical wound care, vacuum dressings and drain charting' },
  { id: 'cat-prepost', code: 'SURG_PROTO', name: 'Pre-Op / Post-Op Protocols', color: 'purple', icon: 'ClipboardCheck', description: 'Surgical prep checklists, recovery observation and mobilization' },
  { id: 'cat-lab', code: 'LAB_SAMPLE', name: 'Diagnostic & Lab Sampling', color: 'indigo', icon: 'FlaskConical', description: 'Blood draws, cultures, ABGs and specimen collection' },
  { id: 'cat-hygiene', code: 'HYGIENE', name: 'Hygiene & Patient Comfort', color: 'emerald', icon: 'Smile', description: 'Sponge bath, position changes and pressure ulcer prevention' },
  { id: 'cat-admiss', code: 'ADM_DISCH', name: 'Admission & Discharge Prep', color: 'slate', icon: 'FileText', description: 'Patient admission paperwork, cannula, and discharge summary' },
  { id: 'cat-emerg', code: 'EMERG_CODE', name: 'Emergency & Resuscitation', color: 'red', icon: 'AlertTriangle', description: 'Crash cart response, intubation assistance and code protocols' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-001',
    title: 'IV Antibiotic Administration — Ceftriaxone 1g',
    description: 'Reconstitute in 10ml sterile water and infuse over 30 minutes via infusion pump.',
    category_id: 'cat-med',
    category_name: 'Medication Administration',
    category_color: 'blue',
    category_icon: 'Pill',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'High',
    status: 'Pending',
    due_date: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    patient_reference: 'Bed 04 — Anita Deshmukh (UHID: NF-PT-10442)',
    instructions: 'Check patient allergy history for beta-lactams prior to administration.',
    escalated: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    comments: [
      {
        id: 'cm-001',
        task_id: 'tsk-001',
        user_id: 'usr-hns-001',
        user_name: 'Sunita Rao',
        employee_id: 'NF-HNS-002',
        role_name: 'Head Nurse / Supervisor',
        comment: 'Culture sensitivity confirmed Ceftriaxone sensitive. Please administer promptly.',
        created_at: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
      }
    ],
    history: [
      {
        id: 'th-001',
        task_id: 'tsk-001',
        user_id: 'usr-hns-001',
        user_name: 'Sunita Rao',
        employee_id: 'NF-HNS-002',
        action: 'CREATED_AND_ASSIGNED',
        details: 'Assigned to Staff Nurse Priya Sharma for 14:00 dose.',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      }
    ]
  },
  {
    id: 'tsk-002',
    title: 'Arterial Blood Gas (ABG) Sampling & Heparinized Flush',
    description: 'Draw 2ml from left radial arterial line. Check PaO2/FiO2 ratio and record P/F ratio.',
    category_id: 'cat-lab',
    category_name: 'Diagnostic & Lab Sampling',
    category_color: 'indigo',
    category_icon: 'FlaskConical',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'Urgent',
    status: 'In Progress',
    due_date: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    patient_reference: 'Bed 02 — Vikramaditya Sen (UHID: NF-PT-10388)',
    instructions: 'Send immediately on ice bath to STAT Blood Gas analyzer in 3rd floor lab.',
    escalated: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'tsk-003',
    title: 'Post-Op Laparotomy Surgical Dressing Check & Drain Output',
    description: 'Inspect abdominal dressing for soakage. Record volume and color of Jackson-Pratt drain.',
    category_id: 'cat-wound',
    category_name: 'Wound Dressing & Drain Care',
    category_color: 'amber',
    category_icon: 'Bandage',
    ward_id: 'ward-sicu',
    ward_name: 'Surgical ICU (SICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'High',
    status: 'Completed',
    due_date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    patient_reference: 'Bed 08 — Mohammed Irfan (UHID: NF-PT-10490)',
    completion_notes: 'Dressing dry and intact. JP Drain #1 drained 45ml serosanguinous fluid over 6 hours.',
    completed_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    completed_by: 'usr-nrs-001',
    completed_by_name: 'Priya Sharma',
    escalated: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'tsk-004',
    title: 'Hourly Neurological Assessment (GCS & Pupil Symmetry)',
    description: 'Document Eye opening, Verbal response, Motor score and pupillary light reactivity.',
    category_id: 'cat-vitals',
    category_name: 'Vitals & Monitoring',
    category_color: 'teal',
    category_icon: 'Activity',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'Urgent',
    status: 'In Progress',
    due_date: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
    patient_reference: 'Bed 01 — Rajeshwar Patel (UHID: NF-PT-10311)',
    instructions: 'Report immediately to on-duty intensivist if GCS drops by >= 2 points.',
    escalated: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: 'tsk-005',
    title: 'Central Venous Catheter (CVC) Dressing Change with Chlorhexidine',
    description: 'Sterile change of triple lumen CVC dressing using 2% Chlorhexidine biopatch.',
    category_id: 'cat-wound',
    category_name: 'Wound Dressing & Drain Care',
    category_color: 'amber',
    category_icon: 'Bandage',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'Medium',
    status: 'Pending',
    due_date: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    patient_reference: 'Bed 05 — Meenakshi Sundaram (UHID: NF-PT-10455)',
    instructions: 'Adhere strictly to NABH CVC bundle guidelines. Replace biopatch.',
    escalated: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'tsk-006',
    title: 'Blood Glucose Monitoring & Sliding Scale Regular Insulin',
    description: 'Check capillary blood glucose via glucometer before meals.',
    category_id: 'cat-vitals',
    category_name: 'Vitals & Monitoring',
    category_color: 'teal',
    category_icon: 'Activity',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'Medium',
    status: 'Completed',
    due_date: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    patient_reference: 'Bed 06 — Gurpreet Singh (UHID: NF-PT-10471)',
    completion_notes: 'CBG 184 mg/dL. 4 Units Regular Human Insulin administered subcutaneously.',
    completed_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    completed_by: 'usr-nrs-001',
    completed_by_name: 'Priya Sharma',
    escalated: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'tsk-007',
    title: 'Blood Transfusion (1 Unit Packed Red Blood Cells - PRBC)',
    description: 'Verify cross-match compatibility with second registered nurse before spike.',
    category_id: 'cat-med',
    category_name: 'Medication Administration',
    category_color: 'blue',
    category_icon: 'Pill',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    assigned_to: 'usr-nrs-001',
    assigned_to_name: 'Priya Sharma',
    assigned_to_emp_id: 'NF-NUR-101',
    created_by: 'usr-hns-001',
    created_by_name: 'Sunita Rao',
    priority: 'Urgent',
    status: 'Pending',
    due_date: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // Overdue
    patient_reference: 'Bed 02 — Vikramaditya Sen (UHID: NF-PT-10388)',
    instructions: 'Record baseline vitals at 0, 15, 30, and 60 minutes. Watch for hemolytic reaction.',
    escalated: 1,
    escalated_reason: 'Blood bank release delayed by 30 minutes; unit warming complete.',
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  }
];

export const INITIAL_TEMPLATES: RegisterTemplate[] = [
  {
    id: 'tmpl-daily-act',
    code: 'REGISTER-DAILY-ACT',
    name: 'Daily Nursing Activity Register',
    description: 'Comprehensive ward-level log of shift clinical activities, interventions, and care delivered.',
    active: 1,
    fieldsSchema: [
      { key: 'patientUhid', label: 'Patient UHID / Bed', type: 'text', required: true },
      { key: 'patientName', label: 'Patient Full Name', type: 'text', required: true },
      { key: 'clinicalIntervention', label: 'Intervention / Care Details', type: 'textarea', required: true },
      { key: 'vitalSigns', label: 'Vitals (BP, HR, SpO2, Temp)', type: 'text', required: true },
      { key: 'careCategory', label: 'Care Category', type: 'select', options: ['Routine Care', 'Medication', 'Emergency Intervention', 'Wound Management'], required: true },
      { key: 'doctorRoundsNote', label: 'Doctor Instructions / Rounds Note', type: 'text' },
    ]
  },
  {
    id: 'tmpl-shift-duty',
    code: 'REGISTER-SHIFT-DUTY',
    name: 'Shift Duty & Attendance Register',
    description: 'Shift roster, on-duty staff roll call, designated ward allocation and supervisory sign-off.',
    active: 1,
    fieldsSchema: [
      { key: 'shiftType', label: 'Shift Timing', type: 'select', options: ['Morning (07:00 - 15:30)', 'Evening (15:00 - 23:30)', 'Night (23:00 - 07:30)'], required: true },
      { key: 'totalStaffPresent', label: 'Staff Count on Duty', type: 'number', required: true },
      { key: 'absentStaffNames', label: 'Absentees / Leave', type: 'text' },
      { key: 'supervisorSignOff', label: 'Charge Nurse Verifier', type: 'text', required: true },
      { key: 'wardStatusReport', label: 'Overall Ward Operational Status', type: 'textarea' },
    ]
  },
  {
    id: 'tmpl-adm-dis',
    code: 'REGISTER-ADM-DIS',
    name: 'Patient Admission / Discharge Register',
    description: 'Formal census log of patient arrivals, bed assignments, transfers and discharge clearances.',
    active: 1,
    fieldsSchema: [
      { key: 'eventNature', label: 'Transaction Type', type: 'select', options: ['Admission', 'Discharge', 'Internal Transfer IN', 'Internal Transfer OUT'], required: true },
      { key: 'uhid', label: 'Patient UHID', type: 'text', required: true },
      { key: 'patientName', label: 'Patient Name & Age', type: 'text', required: true },
      { key: 'assignedBed', label: 'Allocated Bed Number', type: 'text', required: true },
      { key: 'consultantDoctor', label: 'Attending Consultant Doctor', type: 'text', required: true },
      { key: 'primaryDiagnosis', label: 'Primary Diagnosis / ICD', type: 'text', required: true },
      { key: 'dischargeCondition', label: 'Discharge Condition (if applicable)', type: 'select', options: ['Stable', 'Transferred to Higher Center', 'LAMA', 'Deceased', 'N/A (Admission)'] },
    ]
  },
  {
    id: 'tmpl-nurse-notes',
    code: 'REGISTER-NURSE-NOTES',
    name: 'Clinical Nursing Notes Register',
    description: 'Narrative clinical progression notes using standard DAR (Data, Action, Response) format.',
    active: 1,
    fieldsSchema: [
      { key: 'patientId', label: 'Patient Bed / UHID', type: 'text', required: true },
      { key: 'focusProblem', label: 'Clinical Focus / Symptom', type: 'text', required: true },
      { key: 'objectiveData', label: 'Data (Observations & Signs)', type: 'textarea', required: true },
      { key: 'nursingAction', label: 'Action (Interventions Executed)', type: 'textarea', required: true },
      { key: 'patientResponse', label: 'Response (Outcome Evaluated)', type: 'textarea', required: true },
    ]
  },
  {
    id: 'tmpl-mar',
    code: 'REGISTER-MAR',
    name: 'Medication Administration Register (MAR)',
    description: 'Legal record of all scheduled oral, intravenous, and narcotic drug administrations.',
    active: 1,
    fieldsSchema: [
      { key: 'patientDetails', label: 'Patient UHID & Bed', type: 'text', required: true },
      { key: 'drugName', label: 'Drug Name & Strength', type: 'text', required: true },
      { key: 'dosageRoute', label: 'Dose & Route (IV/PO/SC/IM)', type: 'text', required: true },
      { key: 'scheduledTime', label: 'Scheduled Time', type: 'text', required: true },
      { key: 'batchNumber', label: 'Medication Batch Lot #', type: 'text', required: true },
      { key: 'doubleCheckNurse', label: 'Second Nurse Witness (High-Alert / Narcotics)', type: 'text' },
      { key: 'adverseReaction', label: 'Adverse Reaction / Adverse Signs', type: 'text' },
    ]
  },
  {
    id: 'tmpl-equip-log',
    code: 'REGISTER-EQUIP-LOG',
    name: 'Equipment Usage & Calibration Register',
    description: 'Defibrillator checks, ventilators, syringe pumps, calibration status and bio-med incidents.',
    active: 1,
    fieldsSchema: [
      { key: 'equipmentName', label: 'Equipment Model & Serial #', type: 'text', required: true },
      { key: 'equipmentLocation', label: 'Ward / Bed Location', type: 'text', required: true },
      { key: 'functionalStatus', label: 'Functional Test Status', type: 'select', options: ['Pass - Operational', 'Battery Low', 'Calibration Required', 'Defective - Out of Service'], required: true },
      { key: 'serviceLogDate', label: 'Last Biomedical Service Date', type: 'text' },
      { key: 'technicianNotes', label: 'Maintenance & Cleaning Notes', type: 'textarea' },
    ]
  },
  {
    id: 'tmpl-incident',
    code: 'REGISTER-INCIDENT',
    name: 'Clinical Incident & Near-Miss Register',
    description: 'NABH sentinel event and medication error confidential reporting register.',
    active: 1,
    fieldsSchema: [
      { key: 'incidentSeverity', label: 'Severity Level', type: 'select', options: ['Near Miss (No Harm)', 'Minor Incident', 'Moderate Harm', 'Major / Sentinel Event'], required: true },
      { key: 'incidentCategory', label: 'Incident Category', type: 'select', options: ['Medication Error', 'Patient Fall', 'Infiltration / Phlebitis', 'Equipment Failure', 'Missing Consumables', 'Other'], required: true },
      { key: 'incidentSummary', label: 'Detailed Event Narrative', type: 'textarea', required: true },
      { key: 'immediateActionTaken', label: 'Immediate Corrective Action', type: 'textarea', required: true },
      { key: 'medicalOfficerNotified', label: 'Medical Officer Informed', type: 'text', required: true },
    ]
  },
  {
    id: 'tmpl-stock-tx',
    code: 'REGISTER-STOCK-TX',
    name: 'Stock Receipt & Ward Issue Register',
    description: 'Ledger of pharmaceutical and surgical stock received from central store and issued to beds.',
    active: 1,
    fieldsSchema: [
      { key: 'transactionType', label: 'Direction', type: 'select', options: ['Stock Received from Pharmacy', 'Issued to Bed/Patient', 'Inter-Ward Transfer', 'Return to Central Store'], required: true },
      { key: 'itemDetails', label: 'Item Name & Code', type: 'text', required: true },
      { key: 'quantity', label: 'Quantity & Unit', type: 'text', required: true },
      { key: 'batchAndExpiry', label: 'Batch # & Expiry Date', type: 'text', required: true },
      { key: 'voucherNumber', label: 'Store Indent / Voucher #', type: 'text', required: true },
    ]
  },
  {
    id: 'tmpl-handover',
    code: 'REGISTER-HANDOVER',
    name: 'Structured ISBAR Handover Register',
    description: 'Legal shift transition log with identification, clinical situation, background, assessment & recommendation.',
    active: 1,
    fieldsSchema: [
      { key: 'outgoingNurse', label: 'Outgoing Nurse Sign-Off', type: 'text', required: true },
      { key: 'incomingNurse', label: 'Incoming Nurse Sign-Off', type: 'text', required: true },
      { key: 'highRiskPatients', label: 'Critical / High-Risk Patients', type: 'textarea', required: true },
      { key: 'pendingInvestigativeTasks', label: 'Pending Lab / Radiology Results', type: 'textarea', required: true },
      { key: 'controlledSubstancesCheck', label: 'Narcotics & Controlled Drug Count Verified', type: 'select', options: ['Verified & Matched', 'Discrepancy Logged'], required: true },
    ]
  }
];

export const INITIAL_REGISTER_ENTRIES: RegisterEntry[] = [
  {
    id: 'reg-001',
    register_code: 'REGISTER-DAILY-ACT',
    register_name: 'Daily Nursing Activity Register',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    user_id: 'usr-nrs-001',
    author_name: 'Priya Sharma',
    author_emp_id: 'NF-NUR-101',
    date: new Date().toISOString().split('T')[0],
    status: 'FINAL',
    current_version: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    data: {
      patientUhid: 'NF-PT-10442 / Bed 04',
      patientName: 'Anita Deshmukh',
      careCategory: 'Medication',
      clinicalIntervention: 'Administered IV Ceftriaxone 1g with normal saline flush. Site clean without signs of thrombophlebitis.',
      vitalSigns: 'BP 118/74, HR 82 bpm, SpO2 98% on Room Air, Temp 98.6 F',
      doctorRoundsNote: 'Dr. Anand (Intensivist) reviewed. Step down to oral cefixime planned for tomorrow.'
    }
  },
  {
    id: 'reg-002',
    register_code: 'REGISTER-NURSE-NOTES',
    register_name: 'Clinical Nursing Notes Register',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    user_id: 'usr-nrs-001',
    author_name: 'Priya Sharma',
    author_emp_id: 'NF-NUR-101',
    date: new Date().toISOString().split('T')[0],
    status: 'AMENDED',
    current_version: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    data: {
      patientId: 'Bed 02 — Vikramaditya Sen (NF-PT-10388)',
      focusProblem: 'Acute respiratory distress and hypoxemia',
      objectiveData: 'Tachypneic at 28 breaths/min. SpO2 89% on 4L nasal prongs. Bilateral coarse crepitations in lung bases.',
      nursingAction: 'Upgraded oxygen delivery to Venturi mask 50% FiO2 at 10L/min. Elevated head of bed to 45 degrees. Notified on-call intensivist.',
      patientResponse: 'SpO2 improved to 95% within 12 minutes. ABG sample drawn and dispatched.'
    },
    history: [
      {
        id: 'rgh-001',
        entry_id: 'reg-002',
        version: 1,
        user_id: 'usr-nrs-001',
        edited_by_name: 'Priya Sharma',
        edited_by_emp_id: 'NF-NUR-101',
        reason: 'Corrected Venturi mask FiO2 percentage from 40% to 50% as per doctor bedside order.',
        created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
        data: {
          patientId: 'Bed 02 — Vikramaditya Sen (NF-PT-10388)',
          focusProblem: 'Acute respiratory distress and hypoxemia',
          objectiveData: 'Tachypneic at 28 breaths/min. SpO2 89% on 4L nasal prongs.',
          nursingAction: 'Upgraded oxygen delivery to Venturi mask 40% FiO2. Notified on-call intensivist.',
          patientResponse: 'SpO2 improved to 95% within 12 minutes.'
        }
      }
    ]
  },
  {
    id: 'reg-003',
    register_code: 'REGISTER-EQUIP-LOG',
    register_name: 'Equipment Usage & Calibration Register',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    user_id: 'usr-hns-001',
    author_name: 'Sunita Rao',
    author_emp_id: 'NF-HNS-002',
    date: new Date().toISOString().split('T')[0],
    status: 'FINAL',
    current_version: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    data: {
      equipmentName: 'Biphasic Defibrillator — Zoll R Series (#DEF-03)',
      equipmentLocation: 'MICU Emergency Crash Cart #1',
      functionalStatus: 'Pass - Operational',
      serviceLogDate: '12-Oct-2026',
      technicianNotes: 'Morning 30J self-test passed. Battery charged 100%. Pacing cables and adult pads intact.'
    }
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    code: 'PHARM-CEFT-1G',
    name: 'Ceftriaxone 1g IV Injection (Vials)',
    category: 'Pharmaceuticals',
    unit: 'Vial',
    min_stock: 40,
    current_stock: 185,
    cost_per_unit: 48.5,
    active_batch_count: 2,
    earliest_expiry: '2027-04-15',
    batches: [
      { id: 'b-001', item_id: 'inv-001', batch_number: 'CFT-2026-08', quantity: 120, initial_quantity: 150, expiry_date: '2027-04-15', status: 'ACTIVE', location_bin: 'Rack A-02' },
      { id: 'b-002', item_id: 'inv-001', batch_number: 'CFT-2026-11', quantity: 65, initial_quantity: 100, expiry_date: '2027-09-30', status: 'ACTIVE', location_bin: 'Rack A-03' }
    ]
  },
  {
    id: 'inv-002',
    code: 'PHARM-ENOX-40',
    name: 'Enoxaparin Sodium 40mg/0.4ml Prefilled Syringes',
    category: 'Pharmaceuticals',
    unit: 'Syringe',
    min_stock: 30,
    current_stock: 18, // LOW STOCK alert
    cost_per_unit: 142.0,
    active_batch_count: 1,
    earliest_expiry: '2026-11-28', // Near Expiry < 60 days
    batches: [
      { id: 'b-003', item_id: 'inv-002', batch_number: 'ENX-2025-44', quantity: 18, initial_quantity: 80, expiry_date: '2026-11-28', status: 'LOW', location_bin: 'Cold Storage 4°C - Bin 1' }
    ]
  },
  {
    id: 'inv-003',
    code: 'PHARM-PANT-40',
    name: 'Pantoprazole 40mg IV Vials',
    category: 'Pharmaceuticals',
    unit: 'Vial',
    min_stock: 50,
    current_stock: 210,
    cost_per_unit: 24.0,
    active_batch_count: 2,
    earliest_expiry: '2027-08-20',
    batches: [
      { id: 'b-004', item_id: 'inv-003', batch_number: 'PAN-2026-02', quantity: 140, initial_quantity: 200, expiry_date: '2027-08-20', status: 'ACTIVE', location_bin: 'Rack B-01' },
      { id: 'b-005', item_id: 'inv-003', batch_number: 'PAN-2026-09', quantity: 70, initial_quantity: 100, expiry_date: '2027-12-10', status: 'ACTIVE', location_bin: 'Rack B-02' }
    ]
  },
  {
    id: 'inv-004',
    code: 'PHARM-NS-500',
    name: 'Normal Saline 0.9% 500ml IV Infusion Bottle',
    category: 'Pharmaceuticals',
    unit: 'Bottle',
    min_stock: 100,
    current_stock: 450,
    cost_per_unit: 18.5,
    active_batch_count: 2,
    earliest_expiry: '2028-01-10',
    batches: [
      { id: 'b-006', item_id: 'inv-004', batch_number: 'NS-2026-90', quantity: 300, initial_quantity: 500, expiry_date: '2028-01-10', status: 'ACTIVE', location_bin: 'Fluid Bay 01' },
      { id: 'b-007', item_id: 'inv-004', batch_number: 'NS-2026-94', quantity: 150, initial_quantity: 300, expiry_date: '2028-03-25', status: 'ACTIVE', location_bin: 'Fluid Bay 02' }
    ]
  },
  {
    id: 'inv-005',
    code: 'SURG-CAN-20G',
    name: 'IV Cannula 20G with Injection Port (Pink)',
    category: 'Surgical',
    unit: 'Piece',
    min_stock: 75,
    current_stock: 320,
    cost_per_unit: 14.0,
    active_batch_count: 1,
    earliest_expiry: '2028-06-30',
    batches: [
      { id: 'b-008', item_id: 'inv-005', batch_number: 'CAN-20G-12', quantity: 320, initial_quantity: 400, expiry_date: '2028-06-30', status: 'ACTIVE', location_bin: 'Surg Bay A' }
    ]
  },
  {
    id: 'inv-006',
    code: 'CONS-SYR-5ML',
    name: 'Disposable Syringes 5ml with 22G Needle',
    category: 'Consumables',
    unit: 'Piece',
    min_stock: 150,
    current_stock: 640,
    cost_per_unit: 3.5,
    active_batch_count: 1,
    earliest_expiry: '2028-11-15',
    batches: [
      { id: 'b-009', item_id: 'inv-006', batch_number: 'SYR-5-26', quantity: 640, initial_quantity: 1000, expiry_date: '2028-11-15', status: 'ACTIVE', location_bin: 'Drawer 04' }
    ]
  },
  {
    id: 'inv-007',
    code: 'PPE-GLV-75',
    name: 'Sterile Surgical Latex Gloves Size 7.5',
    category: 'PPE',
    unit: 'Pair',
    min_stock: 100,
    current_stock: 52, // LOW STOCK
    cost_per_unit: 22.0,
    active_batch_count: 1,
    earliest_expiry: '2027-02-28',
    batches: [
      { id: 'b-010', item_id: 'inv-007', batch_number: 'GLV-75-09', quantity: 52, initial_quantity: 250, expiry_date: '2027-02-28', status: 'LOW', location_bin: 'PPE Shelf 02' }
    ]
  }
];

export const INITIAL_STOCK_REQUESTS: StockRequest[] = [
  {
    id: 'req-001',
    request_no: 'REQ-MICU-2026-081',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    requested_by: 'usr-hns-001',
    requested_by_name: 'Sunita Rao',
    requester_name: 'Sunita Rao',
    requested_by_emp_id: 'NF-HNS-002',
    status: 'Pending',
    urgency: 'Urgent',
    notes: 'Urgent restock of Enoxaparin 40mg (only 18 syringes remaining in MICU emergency tray).',
    item_count: 2,
    total_units_requested: 60,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    items: [
      { id: 'ri-001', request_id: 'req-001', item_id: 'inv-002', item_name: 'Enoxaparin Sodium 40mg/0.4ml Prefilled Syringes', item_code: 'PHARM-ENOX-40', unit: 'Syringe', quantity_requested: 50, quantity_approved: 0, available_store_stock: 120 },
      { id: 'ri-002', request_id: 'req-001', item_id: 'inv-007', item_name: 'Sterile Surgical Latex Gloves Size 7.5', item_code: 'PPE-GLV-75', unit: 'Pair', quantity_requested: 100, quantity_approved: 0, available_store_stock: 250 }
    ]
  },
  {
    id: 'req-002',
    request_no: 'REQ-SICU-2026-079',
    ward_id: 'ward-sicu',
    ward_name: 'Surgical ICU (SICU)',
    requested_by: 'usr-nrs-001',
    requested_by_name: 'Priya Sharma',
    requester_name: 'Priya Sharma',
    requested_by_emp_id: 'NF-NUR-101',
    status: 'Approved',
    urgency: 'Normal',
    notes: 'Weekly routine replenishment of Normal Saline and 20G Cannulas.',
    item_count: 2,
    total_units_requested: 150,
    reviewed_by: 'usr-inv-001',
    reviewed_by_name: 'Rajesh Kumar',
    review_comment: 'Approved in full from central stores inventory.',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    items: [
      { id: 'ri-003', request_id: 'req-002', item_id: 'inv-004', item_name: 'Normal Saline 0.9% 500ml IV Infusion Bottle', item_code: 'PHARM-NS-500', unit: 'Bottle', quantity_requested: 100, quantity_approved: 100, available_store_stock: 450 },
      { id: 'ri-004', request_id: 'req-002', item_id: 'inv-005', item_name: 'IV Cannula 20G with Injection Port (Pink)', item_code: 'SURG-CAN-20G', unit: 'Piece', quantity_requested: 50, quantity_approved: 50, available_store_stock: 320 }
    ]
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  { id: 'shift-m', code: 'MORNING', name: 'Morning Shift', start_time: '07:00', end_time: '15:30' },
  { id: 'shift-e', code: 'EVENING', name: 'Evening Shift', start_time: '15:00', end_time: '23:30' },
  { id: 'shift-n', code: 'NIGHT', name: 'Night Shift', start_time: '23:00', end_time: '07:30' },
];

export const INITIAL_SHIFT_ASSIGNMENTS: ShiftAssignment[] = [
  {
    id: 'sa-001',
    shift_id: 'shift-m',
    shift_name: 'Morning Shift',
    shift_code: 'MORNING',
    start_time: '07:00',
    end_time: '15:30',
    user_id: 'usr-nrs-001',
    staff_name: 'Priya Sharma',
    employee_id: 'NF-NUR-101',
    role_name: 'Nurse',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    department_name: 'Intensive Care Unit',
    date: new Date().toISOString().split('T')[0],
    status: 'ON_DUTY',
    notes: 'Assigned to Beds 01 to 04 critical care patients.',
  },
  {
    id: 'sa-002',
    shift_id: 'shift-m',
    shift_name: 'Morning Shift',
    shift_code: 'MORNING',
    start_time: '07:00',
    end_time: '15:30',
    user_id: 'usr-hns-001',
    staff_name: 'Sunita Rao',
    employee_id: 'NF-HNS-002',
    role_name: 'Head Nurse / Supervisor',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    department_name: 'Intensive Care Unit',
    date: new Date().toISOString().split('T')[0],
    status: 'ON_DUTY',
    notes: 'Shift In-Charge & clinical escalation supervisor.',
  },
  {
    id: 'sa-003',
    shift_id: 'shift-e',
    shift_name: 'Evening Shift',
    shift_code: 'EVENING',
    start_time: '15:00',
    end_time: '23:30',
    user_id: 'usr-nrs-org',
    staff_name: 'Nurse Sarah Jenkins',
    employee_id: 'EMP-NRS-001',
    role_name: 'Nurse',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    department_name: 'Intensive Care Unit',
    date: new Date().toISOString().split('T')[0],
    status: 'SCHEDULED',
    notes: 'Relief nurse for afternoon-evening handover.',
  }
];

export const INITIAL_HANDOVERS: Handover[] = [
  {
    id: 'hnd-001',
    ward_id: 'ward-micu',
    ward_name: 'Medical ICU (MICU)',
    shift_id: 'shift-m',
    shift_name: 'Morning Shift',
    shift_code: 'MORNING',
    date: new Date().toISOString().split('T')[0],
    outgoing_nurse_id: 'usr-nrs-001',
    outgoing_nurse_name: 'Priya Sharma',
    outgoing_nurse_emp_id: 'NF-NUR-101',
    incoming_nurse_id: 'usr-nrs-org',
    incoming_nurse_name: 'Nurse Sarah Jenkins',
    incoming_nurse_emp_id: 'EMP-NRS-001',
    status: 'PENDING_ACKNOWLEDGEMENT',
    notes: 'ISBAR Shift Handover Summary:\n- Identification: MICU 14/16 beds occupied.\n- Situation: Bed 02 unstable PaO2; on Venturi mask 50%.\n- Background: Post-CABG Day 2 and severe sepsis.\n- Assessment: Hemodynamics stable on low-dose noradrenaline 0.04 mcg/kg/min.\n- Recommendation: Repeat ABG at 16:00 and monitor CVP trend.',
    equipment_issues: 'Syringe pump #SP-04 in Bed 06 alarm battery warning; bio-med reported.',
    unresolved_incidents: 'None reported.',
    pending_task_ids: 'tsk-001,tsk-002,tsk-007',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    notesList: [
      {
        id: 'hn-001',
        handover_id: 'hnd-001',
        author_id: 'usr-nrs-001',
        author_name: 'Priya Sharma',
        author_emp_id: 'NF-NUR-101',
        note_type: 'PATIENT_CARE',
        content: 'Bed 02 PRBC unit #2 arrived from blood bank. Second RN verification pending.',
        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-001',
    user_id: 'usr-hns-001',
    title: 'Urgent Task Escalation',
    message: 'Blood Transfusion for Bed 02 (Vikramaditya Sen) was escalated due to blood bank release delay.',
    type: 'ESCALATION',
    priority: 'Urgent',
    link: '/tasks',
    is_read: 0,
    is_acknowledged: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'notif-002',
    user_id: 'usr-hns-001',
    title: 'Critical Low Stock Alert',
    message: 'Enoxaparin Sodium 40mg is below safety reorder threshold (18 remaining in stock).',
    type: 'INVENTORY',
    priority: 'High',
    link: '/inventory',
    is_read: 0,
    is_acknowledged: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'notif-003',
    user_id: 'usr-nrs-001',
    title: 'New Clinical Task Assigned',
    message: 'Sister Sunita Rao assigned: Hourly Neurological Assessment for Bed 01.',
    type: 'TASK',
    priority: 'High',
    link: '/tasks',
    is_read: 0,
    is_acknowledged: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  }
];

export const INITIAL_PATIENTS = [
  { id: 'pt-001', uhid: 'NF-PT-10311', name: 'Rajeshwar Patel', age: 62, gender: 'Male', wardId: 'ward-micu', wardName: 'Medical ICU (MICU)', bedNumber: 'Bed 01', consultant: 'Dr. Anand V. (Intensivist)', diagnosis: 'Acute Ischemic Stroke with Left Hemiparesis', admissionDate: '2026-10-18', status: 'ADMITTED' },
  { id: 'pt-002', uhid: 'NF-PT-10388', name: 'Vikramaditya Sen', age: 54, gender: 'Male', wardId: 'ward-micu', wardName: 'Medical ICU (MICU)', bedNumber: 'Bed 02', consultant: 'Dr. Neha K. (Pulmonologist)', diagnosis: 'Severe ARDS secondary to Viral Pneumonia', admissionDate: '2026-10-19', status: 'ADMITTED' },
  { id: 'pt-003', uhid: 'NF-PT-10442', name: 'Anita Deshmukh', age: 48, gender: 'Female', wardId: 'ward-micu', wardName: 'Medical ICU (MICU)', bedNumber: 'Bed 04', consultant: 'Dr. Anand V. (Intensivist)', diagnosis: 'Urosepsis with AKI on CKD Stage 3', admissionDate: '2026-10-20', status: 'ADMITTED' },
  { id: 'pt-004', uhid: 'NF-PT-10455', name: 'Meenakshi Sundaram', age: 71, gender: 'Female', wardId: 'ward-micu', wardName: 'Medical ICU (MICU)', bedNumber: 'Bed 05', consultant: 'Dr. S. Raman (Cardiologist)', diagnosis: 'NSTEMI with Congestive Cardiac Failure', admissionDate: '2026-10-19', status: 'ADMITTED' },
  { id: 'pt-005', uhid: 'NF-PT-10471', name: 'Gurpreet Singh', age: 39, gender: 'Male', wardId: 'ward-micu', wardName: 'Medical ICU (MICU)', bedNumber: 'Bed 06', consultant: 'Dr. Meera P. (Endocrinologist)', diagnosis: 'Diabetic Ketoacidosis (DKA) resolving', admissionDate: '2026-10-21', status: 'ADMITTED' },
  { id: 'pt-006', uhid: 'NF-PT-10490', name: 'Mohammed Irfan', age: 45, gender: 'Male', wardId: 'ward-sicu', wardName: 'Surgical ICU (SICU)', bedNumber: 'Bed 08', consultant: 'Dr. Tariq M. (GI Surgeon)', diagnosis: 'Post-Exploratory Laparotomy for Perforated Appendix', admissionDate: '2026-10-20', status: 'ADMITTED' }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-001', user_id: 'usr-hns-001', user_name: 'Sunita Rao', employee_id: 'NF-HNS-002', action: 'TASK_ASSIGNED', entity: 'TASK', record_id: 'tsk-001', details: 'Assigned Ceftriaxone 1g IV task to Staff Nurse Priya Sharma.', created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 'aud-002', user_id: 'usr-nrs-001', user_name: 'Priya Sharma', employee_id: 'NF-NUR-101', action: 'REGISTER_ENTRY_AMENDED', entity: 'REGISTER_ENTRY', record_id: 'reg-002', details: 'Amended FiO2 percentage from 40% to 50% in Nursing Notes.', created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString() },
  { id: 'aud-003', user_id: 'usr-inv-001', user_name: 'Rajesh Kumar', employee_id: 'NF-INV-001', action: 'STOCK_REQUEST_APPROVED', entity: 'STOCK_REQUEST', record_id: 'req-002', details: 'Approved stock request REQ-SICU-2026-079 for Surgical ICU.', created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
  { id: 'aud-004', user_id: 'usr-adm-001', user_name: 'Dr. Ramesh Hegde', employee_id: 'NF-ADM-001', action: 'USER_LOGIN', entity: 'AUTH', record_id: 'usr-adm-001', details: 'Administrator console login from hospital workstation IP 10.0.4.15.', created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString() }
];
