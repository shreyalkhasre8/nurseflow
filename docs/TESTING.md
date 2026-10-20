# NurseFlow — Automated Testing Guide
## Test Coverage, Edge Cases & Verification Strategy

---

### 1. Testing Philosophy

In critical healthcare environments, software reliability directly impacts patient outcomes. NurseFlow employs automated integration and unit testing powered by Node's built-in test runner (`node:test`) and `assert/strict` via TypeScript (`tsx`).

The test suite validates:
1. **Security & Authentication integrity** (bcrypt hashing, JWT expiry, signature verification).
2. **Server-Side Authorization** (strict role boundaries on protected clinical routes).
3. **Transaction Safety** (preventing inventory balance from turning negative under concurrent usage).
4. **Non-Destructive Versioning** (ensuring original clinical entries are never silently overwritten).
5. **CSV Import Validation** (guarding database integrity against duplicate codes or corrupt rows).

---

### 2. Executing Automated Tests

Run the test suite from the project root:
```bash
npm test
```

Expected output:
```
▶ NurseFlow Clinical Core & Security Test Suite
  ✔ 1. Authentication & Security (Requirement 6, 79)
  ✔ 2. Role-Based Access Control (RBAC) Permissions (Requirement 7, 80)
  ✔ 3. Clinical Task Operations & Life-cycle (Requirements 20, 21, 23)
  ✔ 4. Inventory Transactions & Concurrency Safety (Requirements 31, 32, 33, 35)
  ✔ 5. Digital Registers & Non-Destructive Versioning (Requirements 24, 26, 33)
  ✔ 6. Shift Handover Workflow (Requirements 42, 44, 45)
  ✔ 7. CSV Data Validation Edge Cases (Requirements 65, 66)
✔ NurseFlow Clinical Core & Security Test Suite (12 passed, 0 failed)
```

---

### 3. Detailed Test Cases Covered

#### 1. Authentication & Session Verification
- `should securely verify hashed hospital passwords`: Asserts bcrypt salt and hash verification against timing attacks.
- `should generate valid JWT sessions with user ID and clinical role`: Validates cryptographic payload claims (`id`, `role`, `employeeId`).
- `should reject tampered or expired tokens`: Asserts that modified JWT signatures throw token verification errors.

#### 2. Role-Based Access Control (RBAC)
- `should correctly define role permissions hierarchy`: Verifies that staff nurses cannot perform administrative or stock approval actions without supervisor authorization.

#### 3. Task Management & Clinical Execution
- `should create task and transition through Pending -> In Progress -> Completed`: Asserts status transitions, assignee links, and mandatory completion sign-off notes.
- `should track clinical task escalation with reasoning`: Verifies that escalating an urgent patient care task records supervisory reasons and elevation flags.

#### 4. Inventory Concurrency & Batch Safety
- `should decrement batch quantity on stock issue and update ward inventory`: Asserts database transaction atomicity during inventory movement.
- `should prevent issuing stock exceeding available batch quantity`: Verifies that requests for quantities greater than batch stock are rejected with HTTP 400.
- `should flag expired batches as non-issuable`: Ensures expired pharmaceutical lots cannot be dispensed to patient wards.

#### 5. Digital Registers & Non-Destructive Versioning
- `should create immutable audit version snapshot when entry is corrected`: Asserts that editing an existing register entry increments the version number and saves the previous record in `register_entry_history` alongside a mandatory clinical reason.

#### 6. Shift Handover Verification
- `should create handover and record incoming nurse acknowledgement timestamp`: Verifies the formal shift transition loop and legal digital sign-off timestamp.

#### 7. CSV Import Edge Cases
- `should detect duplicate codes, missing required columns, and invalid categories`: Verifies the 3-step CSV import validator catches missing fields, duplicate SKUs, and malformed entries prior to database commit.
