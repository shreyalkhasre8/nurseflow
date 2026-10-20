# NurseFlow — Nursing Workflow, Digital Register, Shift Handover & Inventory Management System
## Final Year Software Engineering Project

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-better--sqlite3-green.svg)](https://github.com/WiseLibs/better-sqlite3)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> *"Clinical operations, organized."*

---

## 📌 Problem Statement & Engineering Objective

Modern multi-specialty hospitals grapple with fragmented paper charts, missed clinical care tasks during shift changes, untracked consumable movements leading to stockouts or expired medicines, and cumbersome legal audit compliance. 

**NurseFlow** is an enterprise-grade full-stack healthcare operations platform engineered to digitize the end-to-end nursing and hospital ward workflow:
1. **Prevent Missed Care Tasks**: Real-time task scheduling, bedside execution tracking, urgency-based prioritization, and escalation.
2. **NABH/JCI Compliant Digital Registers**: 9 non-destructive clinical registers with immutable version histories (original records are never overwritten).
3. **Structured ISBAR Shift Handovers**: Outgoing nurse summarizes clinical care, transfers pending tasks, and incoming nurse signs off with legal timestamps.
4. **Ward-Level Pharmacy Inventory & Batch Tracking**: Cold chain lots, FEFO expiry safety (<60-day alerts), stock requisitions, and atomic concurrency guards.
5. **Role-Tailored Dashboards**: 4 dedicated dashboards customized for Nurses, Head Nurses/Supervisors, Inventory Managers, and Hospital Administrators.
6. **Data Portability**: Full CSV import with schema validation, CSV export for catalog/reports, and printable PDF layouts.

---

## 🏗️ Architecture & Technology Stack

```
NurseFlow Multi-Tier Architecture:
User / Hospital Staff (Browser)
       │
       ▼
Client Presentation Layer (React 19 + TypeScript + Vite + Tailwind CSS)
       │  (HTTP REST + Bearer JWT)
       ▼
Backend API Gateway (Node.js + Express 5 + TypeScript)
       ├── Authentication & RBAC Middleware
       ├── Controllers (Auth, Task, Register, Inventory, Shift, Handover, Report, Admin, Patient)
       ├── Internal Services (Forensic Audit Logger, In-App Notification Dispatcher)
       │
       ▼
Relational Persistence Layer (SQLite via better-sqlite3 with WAL & Foreign Keys / PostgreSQL)
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, responsive hospital-density UI.
- **Backend**: Node.js, Express 5, TypeScript (`tsx`), RESTful API architecture.
- **Database**: Relational SQLite via `better-sqlite3` with Write-Ahead Logging (WAL) and foreign keys, or managed PostgreSQL.
- **Security**: Salted bcrypt password hashing (10 rounds), stateless JWT sessions, server-side RBAC guards.
- **Testing**: Automated test suite (`node:test`, `assert/strict`).

---

## 🏥 Key Modules & Clinical Workflows

### 1. Role-Based Access Control (4 Personas)
- **Nurse**: Personal shift tasks, register documentation, patient census, outgoing handovers, ward stock requisitions.
- **Head Nurse / Supervisor**: Shift roster scheduling, task assignment, workload distribution, urgent escalations review, stock approvals.
- **Inventory Manager**: Central pharmacy management, batch lots, consignment receiving, ward issues, returns, reconciliation, expiry rotation (FEFO).
- **Administrator**: Staff user accounts, role and ward configurations, department settings, forensic audit logs.
- **1-Click Clinical Role Switcher**: Top preview bar allows instantaneous switching between personas during viva demonstrations.

### 2. Clinical Task Management
- High-density filterable grid (Ward, Category, Priority, Status, Overdue).
- Prioritization: `Low`, `Medium`, `High`, `Urgent` (color-coded to clinical guidelines).
- Life-cycle: `Pending` ➔ `In Progress` ➔ `Completed` (with mandatory clinical sign-off notes).
- Task detail drawer with real-time comments thread and forensic activity history.
- Clinical escalation workflow for deteriorating patients.

### 3. Digital Nursing Registers (9 Clinical Registers)
1. **Daily Nursing Activity Register**: Bed occupancy, doctor rounds, and interventions.
2. **Shift Duty Register**: Roster sign-offs, critical patient count, emergency coverage.
3. **Patient Admission & Discharge Register**: Bed transfers, MLC status, belongings handover.
4. **Nursing Clinical Notes (SOAP Progress Notes)**: Subjective complaints, objective vitals, assessment, plan.
5. **Medication Administration Register (MAR)**: Scheduled vs actual times, dose, route, adverse checks.
6. **Equipment Usage & Maintenance Register**: Biomedical asset tags, operational test status, calibration.
7. **Incident Report Register**: Non-punitive clinical incident and near-miss reporting.
8. **Stock Receipt & Issue Register**: Physical ward-level consumable ledger.
9. **Handover Register (ISBAR Format)**: Structured clinical shift transition record.
- **Non-Destructive Versioning**: Editing an entry archives the previous version in `register_entry_history` with mandatory clinical reason, author, and timestamp.
- **Data Export**: Instant CSV export and printable PDF formatted records.

### 4. Ward & Central Store Inventory Management
- **Catalog & SKU Tracking**: Code, category (Pharmaceuticals, Consumables, Surgical, PPE, Equipment), unit, cost, minimum safety threshold.
- **Batch Tracking**: Lot numbers, manufacture/purchase dates, expiration dates, shelf bins, near-expiry (<60d) and expired alerts.
- **CSV Data Import**: 3-step import process (Download template, validate file, preview valid rows/errors, confirm atomic database transaction).
- **CSV Export**: One-click download of the active inventory catalog with balances.
- **Stock Requisition Workflow**: Staff nurses raise ward indents; Supervisors/Inventory Managers approve, reject, or fulfill.

### 5. Structured Shift Handover Module
- Outgoing nurse captures patient care summary, attached pending task IDs, equipment issues, and incidents.
- Incoming nurse reviews and signs off with legal digital timestamp (`ACKNOWLEDGED`).

### 6. Clinical Operations Reports & Analytics
- **Task Performance & Delays**: Completion rates, overdue counts, daily trend.
- **Overdue Care Tasks**: Detailed clinical delay tracking with hours overdue and patient UHID.
- **Shift Nurse Workload**: Tasks assigned, in-progress, completed, and overdue per nurse.
- **Ward Stock Consumption**: Issues, store receipts, returns, adjustments, and current balance.
- **Low Stock & Expiry Safety**: Items below safety threshold and lots expiring within 60 days.
- **Handover Compliance**: Handover verification rates across inpatient wards.
- **Stock Movement Ledger**: 100-event chronological material transfer audit log.
- **CSV Export & Formatted Print (PDF)** on every report.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+ installed
- npm 9+

### Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repo-url>
   cd nurseflow
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```

3. **Seed the Demonstration Dataset**:
   Populates the database with 65+ Indian hospital staff, 150 patients, 120 SKUs, 750+ tasks, 600+ register entries, and 1,200+ transactions:
   ```bash
   npm run seed
   ```

4. **Run the Application**:
   ```bash
   # Starts Express backend and hosts React frontend
   npm start
   ```
   Open **`http://localhost:5000`** in your browser.

   *(For local frontend development with Hot Module Reloading: `npm run client` on `http://localhost:5173`)*

---

## 🔑 Demonstration Accounts

All demo accounts share the password: **`hospital123`**

| Staff Member | Role | Department / Ward | Email / Employee ID |
| :--- | :--- | :--- | :--- |
| **Priya Sharma** | Nurse | Medical ICU (MICU) | `priya.sharma@nurseflow.local` (`NF-NUR-101`) |
| **Sister Mary Thomas** | Nurse | Female Surgical Ward | `mary.thomas@nurseflow.local` (`NF-NUR-102`) |
| **Ananya Patel** | Nurse | Emergency & Trauma | `ananya.patel@nurseflow.local` (`NF-NUR-103`) |
| **Deepa Nair** | Nurse | Male Medical Ward | `deepa.nair@nurseflow.local` (`NF-NUR-104`) |
| **Sunita Rao** | Head Nurse / Supervisor | Intensive Care Unit | `sunita.rao@nurseflow.local` (`NF-SUP-201`) |
| **Sneha Kulkarni** | Head Nurse / Supervisor | General Surgery | `sneha.kulkarni@nurseflow.local` (`NF-SUP-202`) |
| **Rajesh Kumar** | Inventory Manager | Central Stores & Pharmacy | `rajesh.kumar@nurseflow.local` (`NF-INV-301`) |
| **Dr. Ramesh Hegde** | Administrator | Hospital Administration | `admin@nurseflow.local` (`NF-ADM-401`) |

*Tip: Use the top **1-Click Demo Role Switcher Bar** on any page to switch between personas instantly without logging out!*

---

## 🧪 Automated Testing

NurseFlow includes an automated integration test suite validating security, RBAC, task transitions, inventory transactions, register versioning, and CSV validation:

```bash
npm test
```

---

## 🎯 Viva Demonstration Script (Walkthrough for Examiners)

1. **Login as Nurse (Priya Sharma)**:
   - View personalized **Nurse Dashboard** with current shift timing, personal tasks due, and pending handover alerts.
   - Go to **Tasks**, click a pending medication task (`IV Ceftriaxone 1g`), start it, and sign it off as completed with notes.
   - Go to **Registers**, select `Daily Nursing Activity Register`, create an entry for Bed 4, then amend it to demonstrate **non-destructive version history**.
   - Go to **Inventory**, click **Request Stock Indent** to requisition 30 Normal Saline bottles for MICU.
2. **Switch to Inventory Manager (Rajesh Kumar)**:
   - View the **Inventory Manager Dashboard** with live SKUs, low-stock alerts, near-expiry lots, and pending requisitions.
   - Review Priya's requisition and click **Approve Indent**.
   - Click **Import CSV**, upload a CSV file or download the template, review the live validation preview, and confirm the import.
   - Click **Export CSV** to download the updated catalog.
3. **Switch to Head Nurse / Supervisor (Sunita Rao)**:
   - View the **Supervisor Dashboard** displaying active census, staff on shift, and ward workload.
   - Go to **Shift & Handover**, view the outgoing shift report, and acknowledge it with a legal timestamp.
   - Go to **Reports**, switch between **Task Performance**, **Overdue Tasks**, **Workload**, and **Stock Movement**, and click **Print Report (PDF)**.
4. **Switch to Administrator (Dr. Ramesh Hegde)**:
   - View the **Admin Dashboard** with system metrics, ward bed occupancy meters, and live forensic telemetry.
   - Go to **Administration**, view the **Audit Logs** table showing complete tracking of every previous action.

---

## 📚 Project Documentation

Detailed academic documentation is available in the `/docs` directory:
- [System Architecture Specification](docs/SYSTEM_ARCHITECTURE.md) (with Mermaid architecture & sequence diagrams)
- [Database Schema & ER Diagram](docs/DATABASE_SCHEMA.md) (with Mermaid ER diagram & data dictionary)
- [REST API Reference](docs/API_DOCUMENTATION.md) (complete endpoints & payload specifications)
- [Demonstration Dataset Documentation](docs/DATASET_DOCUMENTATION.md) (volume metrics & Indian hospital context)
- [Automated Testing Guide](docs/TESTING.md) (test cases & execution guide)
- [Production Deployment Guide](docs/DEPLOYMENT.md) (Docker, Render, VPS, and Cloud PostgreSQL)

---

## 📄 License
This project is developed for final-year engineering degree demonstration and released under the MIT License.
