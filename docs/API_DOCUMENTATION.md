# NurseFlow — REST API Reference Documentation
## Complete Endpoints & Authorization Specification

---

### Authentication Strategy
All secured endpoints require the standard HTTP `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```
Tokens are returned on successful login via `POST /api/auth/login`.

---

### 1. Authentication Endpoints

#### `POST /api/auth/login`
- **Access**: Public
- **Body**:
  ```json
  { "username": "priya.sharma@nurseflow.local", "password": "hospital123" }
  ```
  *(Accepts either email or employee ID as username)*
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr-priya",
      "employeeId": "NF-NUR-101",
      "name": "Priya Sharma",
      "email": "priya.sharma@nurseflow.local",
      "role": "Nurse",
      "wardId": "ward-micu"
    }
  }
  ```

#### `GET /api/auth/me`
- **Access**: Authenticated
- **Response**: Current user profile with clinical role and assigned ward.

#### `GET /api/auth/demo-users`
- **Access**: Public
- **Response**: List of pre-configured demonstration accounts for 1-click clinical testing.

---

### 2. Clinical Task Management

#### `GET /api/tasks/my`
- **Access**: Authenticated
- **Query Params**: `status`, `priority`, `date`, `overdue`
- **Response**: Personal shift tasks assigned to the authenticated nurse.

#### `GET /api/tasks/all`
- **Access**: Authenticated
- **Query Params**: `wardId`, `categoryId`, `status`, `priority`, `search`
- **Response**: All hospital/ward tasks matching filters.

#### `POST /api/tasks`
- **Access**: Authenticated (Nurse, Supervisor, Administrator)
- **Body**:
  ```json
  {
    "title": "Administer IV Ceftriaxone 1g",
    "description": "Post-op fever spike",
    "categoryId": "cat-med",
    "wardId": "ward-micu",
    "assignedTo": "usr-priya",
    "priority": "Urgent",
    "dueDate": "2026-10-21T08:00:00Z",
    "patientReference": "Bed 4 - Gopal Das (UHID-2026-1004)",
    "instructions": "Infuse in 100ml NS over 30 mins"
  }
  ```

#### `PATCH /api/tasks/:id/status`
- **Access**: Authenticated
- **Body**: `{ "status": "Completed", "completionNotes": "Signed off after execution" }`

#### `PATCH /api/tasks/:id/escalate`
- **Access**: Authenticated
- **Body**: `{ "reason": "Patient systolic BP < 80 mmHg. Escalated to Supervisor." }`

#### `POST /api/tasks/:id/comments`
- **Access**: Authenticated
- **Body**: `{ "comment": "Blood sample dispatched to pathology lab." }`

---

### 3. Digital Nursing Registers

#### `GET /api/registers/templates`
- **Access**: Authenticated
- **Response**: All 9 active register schemas (Daily Nursing Activity, Shift Duty, Admission/Discharge, Nursing Notes, MAR, Equipment Usage, Incident Report, Stock Register, Handover Register).

#### `GET /api/registers/entries`
- **Access**: Authenticated
- **Query Params**: `code`, `wardId`, `date`, `search`
- **Response**: List of registered clinical entries.

#### `POST /api/registers/entries`
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "registerCode": "daily_nursing_activity",
    "wardId": "ward-micu",
    "date": "2026-10-20",
    "data": { "bedNo": "Bed 4", "patientName": "Gopal Das", "diagnosis": "Severe Pneumonia", "activityPerformed": "Hourly vitals..." }
  }
  ```

#### `PUT /api/registers/entries/:id/correct`
- **Access**: Authenticated
- **Description**: Non-destructive correction. Preserves current version in `register_entry_history` and increments entry version.
- **Body**:
  ```json
  {
    "data": { "bedNo": "Bed 4", "fluidIntakeOutput": "Intake: 1800ml" },
    "reason": "Recalculation from infusion pump volume"
  }
  ```

---

### 4. Ward & Central Store Inventory

#### `GET /api/inventory/metrics`
- **Access**: Authenticated
- **Response**: `{ totalItems, lowStockCount, nearExpiryCount, expiredCount, pendingRequestsCount }`

#### `GET /api/inventory/items`
- **Access**: Authenticated
- **Query Params**: `category`, `wardId`, `status` (`ALL`, `LOW_STOCK`, `NEAR_EXPIRY`, `EXPIRED`), `search`

#### `POST /api/inventory/receive`
- **Access**: Inventory Manager, Administrator
- **Body**: `{ itemId, batchNumber, quantity, expiryDate, costPerUnit, source, locationBin }`

#### `POST /api/inventory/issue`
- **Access**: Inventory Manager, Supervisor, Administrator
- **Body**: `{ itemId, batchId, quantity, wardId, reason }`

#### `POST /api/inventory/return`
- **Access**: Inventory Manager, Supervisor, Administrator
- **Body**: `{ itemId, batchId, quantity, wardId, reason }`

#### `POST /api/inventory/adjust`
- **Access**: Inventory Manager, Administrator
- **Body**: `{ itemId, batchId, newQuantity, reason }`

#### `GET /api/inventory/template/csv`
- **Access**: Authenticated
- **Response**: Downloadable standardized CSV template file (`text/csv`).

#### `POST /api/inventory/import/validate`
- **Access**: Inventory Manager, Administrator
- **Body**: `{ "rows": [ { "code": "...", "name": "...", "category": "...", "unit": "..." } ] }`
- **Response**: `{ totalRows, validCount, errorCount, errors, preview }`

#### `POST /api/inventory/import/confirm`
- **Access**: Inventory Manager, Administrator
- **Body**: `{ "items": [ ...validRows ] }`
- **Response**: `{ success: true, importedCount: 15 }`

#### `GET /api/inventory/export/csv`
- **Access**: Authenticated
- **Response**: Downloadable CSV export of all inventory items and store levels.

---

### 5. Ward Stock Requisitions

#### `GET /api/stock-requests`
- **Access**: Authenticated
- **Query Params**: `wardId`, `status` (`Pending`, `Approved`, `Fulfilled`, `Rejected`)

#### `POST /api/stock-requests`
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "wardId": "ward-micu",
    "urgency": "Urgent",
    "notes": "Emergency consumables indent",
    "items": [{ "itemId": "inv-iv-ns-500", "quantityRequested": 30 }]
  }
  ```

#### `PATCH /api/stock-requests/:id/review`
- **Access**: Inventory Manager, Supervisor, Administrator
- **Body**: `{ "status": "Approved", "reviewComment": "Dispatched to ward" }`

---

### 6. Shifts & Roster

#### `GET /api/shifts/types`
- **Access**: Authenticated
- **Response**: List of shift definitions (Morning: 07:00-15:00, Evening: 15:00-23:00, Night: 23:00-07:00).

#### `GET /api/shifts/assignments`
- **Access**: Authenticated
- **Query Params**: `date`, `wardId`, `userId`

#### `POST /api/shifts/assign`
- **Access**: Supervisor, Administrator
- **Body**: `{ shiftId, userId, wardId, date, notes }`
- **Validation**: Checks for schedule double-booking and `ON_LEAVE` / `SICK` availability conflicts.

---

### 7. Shift Handover Workflow

#### `GET /api/handovers`
- **Access**: Authenticated
- **Query Params**: `wardId`, `date`, `status`

#### `POST /api/handovers`
- **Access**: Authenticated (Nurse, Supervisor)
- **Body**: `{ wardId, shiftId, date, incomingNurseId, notes, equipmentIssues, unresolvedIncidents, pendingTaskIds }`

#### `PATCH /api/handovers/:id/acknowledge`
- **Access**: Authenticated
- **Body**: `{ "acknowledgmentNote": "Handover accepted and verified." }`
- **Response**: Records `acknowledged_at` legal timestamp and transitions status to `ACKNOWLEDGED`.

---

### 8. Clinical Reports & Forensics

- `GET /api/reports/task-summary`: Completion, pending, overdue counts, daily trend, and clinical category distribution.
- `GET /api/reports/workload`: Shift nurse task allocation, completion, in-progress, and overdue counts.
- `GET /api/reports/inventory-consumption`: Ward issues, store receipts, returns, adjustments, and current balance.
- `GET /api/reports/handover-compliance`: Inpatient ward handover acknowledgement compliance percentage.
- `GET /api/reports/overdue-tasks`: Hours overdue, assigned nurse, patient reference, and priority.
- `GET /api/reports/inventory-alerts`: Depleted stock items and batches expiring within 60 days.
- `GET /api/reports/stock-movement`: Transaction type volume and chronological material movements.
