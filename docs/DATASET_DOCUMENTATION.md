# NurseFlow — Demonstration Dataset Documentation
## Realistic Indian Multi-Specialty Hospital Dataset

---

### 1. Dataset Generation Objectives

In accordance with academic final-year software engineering project standards, NurseFlow is seeded with a comprehensive, realistic, and relationally linked clinical dataset. This enables:
1. Meaningful visual analytics and compliance percentages rather than artificial 0% or 100% metrics.
2. Realistic demonstration scenarios (e.g. nurse executing task, inventory manager receiving/issuing consignment, supervisor reviewing handovers).
3. Full compliance with Indian healthcare operational standards (NABH / JCI documentation conventions).

---

### 2. Dataset Entity Volumes & Metrics

| Entity | Record Volume | Description & Realism Standards |
| :--- | :--- | :--- |
| **Departments** | 7 | ICU, General Medicine, General Surgery, Pediatrics, Emergency, Orthopedics, Administration |
| **Clinical Wards** | 10 | MICU, SICU, MMW, FMW, FSW, MSW, PED, ETR, OPOW, Day Care Infusion |
| **Healthcare Staff** | 65+ | 45+ Staff Nurses, 8 Supervisors, 5 Inventory Pharmacists, 7 Medical Administrators |
| **Synthetic Inpatients** | 150 | Admitted across 10 wards with real clinical diagnoses, age, gender, and bed assignments |
| **Clinical Tasks** | 750+ | Spread across 8 categories (Medication, Vitals, Wound, Care, Lab, Procedure, Disinfection, Equipment) |
| **Register Entries** | 600+ | Across all 9 clinical registers over 30 days, including amended entries with full version histories |
| **Inventory Catalog SKUs** | 120 | Pharmaceuticals, Consumables, Surgical supplies, PPE, and Medical Equipment |
| **Inventory Batches** | 280+ | Active batches, near-expiry lots (&lt;60d), low stock lots, and expired quarantined lots |
| **Stock Transactions** | 1,200+ | Chronological ledger of `RECEIVED`, `ISSUED`, `RETURNED`, and `ADJUSTED` transactions |
| **Stock Requisitions** | 120+ | Multi-item ward requests across `Routine`, `Urgent`, and `Emergency` urgencies |
| **Shift Duty Allocations** | 1,200+ | 90 days of continuous Morning, Evening, and Night duty roster schedules |
| **Structured Handovers** | 250+ | ISBAR format with linked pending tasks, equipment issues, and sign-off timestamps |
| **In-App Notifications** | 550+ | Task assignments, stock threshold alerts, handover requests, and clinical escalations |
| **System Audit Logs** | 1,200+ | Forensic security logs capturing user, action, entity, IP address, and changed payload |

---

### 3. Realistic Naming & Identifier Conventions

- **Employee IDs**:
  - Staff Nurse: `NF-NUR-0101` to `NF-NUR-0145`
  - Supervisor: `NF-SUP-0201` to `NF-SUP-0208`
  - Inventory Manager: `NF-INV-0301` to `NF-INV-0305`
  - Administrator: `NF-ADM-0401` to `NF-ADM-0407`
- **Patient Identifiers**:
  - UHID: `UHID-2026-1001` to `UHID-2026-1150`
- **Requisition Numbers**:
  - `REQ-2026-0001` to `REQ-2026-0125`
- **Staff Profiles**: Realistic Indian names (Priya Sharma, Sister Mary Thomas, Ananya Patel, Sunita Rao, Rajesh Kumar, Dr. Ramesh Hegde) with realistic state nursing council registration numbers (e.g. `KNC-2018-98442`, `INC-KA-2015-10042`).

---

### 4. Running the Seeder

To reset and repopulate the database:
```bash
npm run seed
```
The generator runs within an atomic SQLite transaction, populating the complete 8,000+ record dataset in **under 0.5 seconds**.
