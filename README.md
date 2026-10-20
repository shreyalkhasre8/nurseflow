# NurseFlow — Nursing Workflow, Register & Inventory Management System

NurseFlow is an enterprise-grade hospital clinical operations and nursing workflow management system designed for multi-specialty hospitals and clinics. Built with modern web technologies, it replaces clinical paperwork, prevents missed nursing care tasks, enforces structured shift handovers, provides non-destructive digital registers with immutable versioning, and provides ward-level inventory and requisition tracking.

---

## 🏥 Key Clinical Modules

### 1. Shift & Clinical Role-Based Access Control (RBAC)
- **Nurse**: View assigned shift tasks, update execution status, add completion notes, record digital nursing register entries, submit outgoing shift handovers, acknowledge incoming handovers, request ward stock indents.
- **Head Nurse / Supervisor**: Task scheduling and assignment, workload balancing, duty roster allocation, handover audits, urgent task escalation review, stock indent approvals.
- **Inventory Manager**: Central pharmacy store management, batch and cold chain tracking, consignment receipt, ward stock issuing, returns, physical reconciliation, expiry alerts.
- **Administrator**: Staff user accounts, role and ward configurations, department settings, and security audit logs.
- **1-Click Clinical Role Switcher**: Interactive preview bar at the top of the interface for instantaneous role switching between personas.

### 2. Task Management & Clinical Execution
- **My Tasks vs All Ward Tasks**: Filterable by ward, category, priority, status, and overdue flags.
- **Priorities**: Low, Medium, High, Urgent (color-coded to clinical guidelines).
- **Execution States**: Pending ➔ In Progress ➔ Completed (with sign-off notes) / Cancelled.
- **Clinical Details Drawer**: Patient reference, category, due deadline, instructions, comments communication thread, and audit activity timeline.
- **Escalation Workflow**: Immediate elevation of stalled or deteriorated patient tasks to Supervisor with reason tracking.

### 3. Digital Nursing Registers (9 Clinical Registers)
1. **Daily Nursing Activity Register**: Patient census, bed occupancy, doctor rounds, and nursing interventions.
2. **Shift Duty Register**: Roster sign-offs, critical patient count, emergency coverage, and resident on call.
3. **Patient Admission & Discharge Register**: Inpatient admissions, bed transfers, MLC status, belongings handover.
4. **Nursing Clinical Notes (SOAP Progress Notes)**: Subjective complaints, objective vitals, assessment, and care plan.
5. **Medication Administration Register (MAR)**: Scheduled vs actual administration times, dosage, route, allergy verification, high-alert co-signature.
6. **Equipment Usage & Maintenance Register**: Biomedical asset tags, operational test status, calibration dates, decontamination verification.
7. **Incident Report Register**: Non-punitive clinical incident reporting (near-misses, falls, medication errors).
8. **Stock Receipt & Issue Register**: Physical ward-level consumable ledger.
9. **Handover Register (ISBAR Format)**: Structured clinical shift transition record.
- **Non-Destructive Correction Versioning**: Compliant with NABH / JCI hospital guidelines. Original entries are never overwritten; amendments create an immutable archived version snapshot with mandatory clinical justification, author, and timestamp.
- **Export & Print**: Instant CSV export and printable PDF formatted records.

### 4. Ward & Central Store Inventory Management
- **Catalog & SKU Tracking**: Code, category (Pharmaceuticals, Consumables, Surgical, PPE, Equipment), unit, cost, minimum safety threshold, and active batch counts.
- **Batch Management**: Batch numbers, manufacture/purchase dates, expiration dates, shelf bins, and near-expiry (<60 days) and expired alerts.
- **Movement Ledger**: Complete audit trail of `RECEIVED`, `ISSUED`, `RETURNED`, and `ADJUSTED` transactions.
- **Stock Requisition Workflow**: Staff nurses raise ward indents with urgency flags (Routine, Urgent, Emergency); Supervisors and Inventory Managers review, approve, partially approve, or reject with notes.

### 5. Structured Shift Handover Module
- **Outgoing Nurse**: Summarizes shift clinical events, pending and in-progress tasks transferred to next shift, equipment status, and unresolved incidents.
- **Incoming Nurse**: Reviews comprehensive summary and digitally signs/acknowledges with legal timestamp.
- **Incomplete Handover Flags**: Incomplete handovers are flagged for supervisory review.

### 6. Reports, Analytics & Auditing
- **Task Delay & Performance Analytics**: Daily completion vs overdue rates and category breakdowns.
- **Nurse Workload Distribution**: Active census, task loading, and delay counts per nurse.
- **Ward Stock Consumption**: Issues, receipts, returns, and inventory balance.
- **Handover Compliance**: Handover verification rates across all inpatient wards.
- **System Audit Logs**: Complete forensic log tracking User, Action, Entity, Record ID, IP, and changed attributes.

### 7. Global Search (`Ctrl + K`)
- Instantly searches across Tasks, Inventory Items, Staff Members, Register Entries, and Shift Handovers with categorized results.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express 5, TypeScript (`tsx`).
- **Database**: SQLite with `better-sqlite3`, enforcing relational foreign keys, indexes, and WAL journal mode.
- **Authentication**: JWT token strategy with bcrypt password hashing and RBAC middleware.
- **Seed Data**: Realistic Indian multi-specialty hospital datasets (Emergency, General Medicine, ICU, Pediatrics, Surgery, Orthopedics).

---

## 🚀 Running the Application

### Accessing the Live App
- **Full-Stack Application**: `http://localhost:5000` (Backend API + Client SPA)
- **Vite Development Server**: `http://localhost:5173` (with hot module reload and API proxy)

### Demo User Accounts
All accounts share the default password: **`hospital123`**

| Staff Name | Role | Department / Ward | Email / Employee ID |
| :--- | :--- | :--- | :--- |
| **Priya Sharma** | Nurse | Medical ICU (MICU) | `priya.sharma@nurseflow.local` (`NF-NUR-101`) |
| **Sister Mary Thomas** | Nurse | Female Surgical Ward | `mary.thomas@nurseflow.local` (`NF-NUR-102`) |
| **Ananya Patel** | Nurse | Emergency & Trauma | `ananya.patel@nurseflow.local` (`NF-NUR-103`) |
| **Deepa Nair** | Nurse | Male Medical Ward | `deepa.nair@nurseflow.local` (`NF-NUR-104`) |
| **Sunita Rao** | Head Nurse / Supervisor | Intensive Care Unit | `sunita.rao@nurseflow.local` (`NF-SUP-201`) |
| **Sneha Kulkarni** | Head Nurse / Supervisor | General Surgery | `sneha.kulkarni@nurseflow.local` (`NF-SUP-202`) |
| **Rajesh Kumar** | Inventory Manager | Central Stores & Pharmacy | `rajesh.kumar@nurseflow.local` (`NF-INV-301`) |
| **Dr. Ramesh Hegde** | Administrator | Hospital Administration | `admin@nurseflow.local` (`NF-ADM-401`) |

*Tip: You can use the top **Demo Role Switcher Bar** on any screen to switch between any of these profiles in 1 click!*

---

## 📁 Project Structure

```
nurseflow/
├── package.json
├── tsconfig.json
├── data/
│   └── nurseflow.db          # Relational SQLite database
├── server/
│   ├── index.ts              # Express server & static asset host
│   ├── seed.ts               # Indian hospital realistic seed script
│   ├── config/
│   │   └── db.ts             # Database connection & schema DDL
│   ├── middlewares/
│   │   └── auth.ts           # JWT authentication & RBAC middleware
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── taskController.ts
│   │   ├── registerController.ts
│   │   ├── inventoryController.ts
│   │   ├── stockRequestController.ts
│   │   ├── shiftController.ts
│   │   ├── handoverController.ts
│   │   ├── notificationController.ts
│   │   ├── reportController.ts
│   │   ├── adminController.ts
│   │   └── searchController.ts
│   ├── routes/
│   │   └── api.ts            # REST API endpoints
│   └── services/
│       ├── auditService.ts   # Forensic audit logging
│       └── notificationService.ts # In-app notification dispatcher
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx           # Route guards & application shell
        ├── types/index.ts    # TypeScript models
        ├── services/api.ts   # Typed API client
        ├── context/
        │   ├── AuthContext.tsx
        │   └── ToastContext.tsx
        ├── components/
        │   ├── common/       # Badge, Button, Modal, Drawer, Table, PageHeader, etc.
        │   ├── search/       # GlobalSearchModal (Ctrl+K)
        │   └── notifications/# NotificationDrawer
        ├── layouts/
        │   └── DashboardLayout.tsx
        └── pages/
            ├── auth/LoginPage.tsx
            ├── dashboard/
            │   ├── DashboardPage.tsx
            │   ├── NurseDashboard.tsx
            │   └── SupervisorDashboard.tsx
            ├── tasks/TasksPage.tsx
            ├── registers/RegistersPage.tsx
            ├── inventory/InventoryPage.tsx
            ├── handover/HandoverPage.tsx
            ├── shifts/ShiftsPage.tsx
            ├── reports/ReportsPage.tsx
            ├── staff/StaffPage.tsx
            ├── admin/AdminPage.tsx
            └── errors/
```
