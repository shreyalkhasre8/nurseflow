# NurseFlow — System Architecture & Design Specification
## Final Year Engineering Technical Documentation

---

### 1. Architectural Overview

NurseFlow is engineered as an enterprise-grade hospital clinical operations and nursing workflow management system. It follows a multi-tier client-server architecture with strict separation of concerns among:
- **Presentation Layer (Frontend Single Page Application)**
- **API & Authorization Middleware Layer**
- **Business Logic & Service Layer**
- **Relational Persistence Layer (SQLite / PostgreSQL)**

```mermaid
graph TD
    Client["Client Presentation Layer (React 19 + TypeScript + Tailwind CSS)"] -->|HTTPS / REST API| Router["Express 5 API Gateway (/api)"]
    
    subgraph Security Layer
        Router --> AuthMW["Authentication Middleware (JWT Token Validator)"]
        AuthMW --> RBACMW["Role-Based Access Guard (requireRole)"]
    end
    
    subgraph Business Controller Layer
        RBACMW --> AuthCtrl["authController"]
        RBACMW --> TaskCtrl["taskController"]
        RBACMW --> RegCtrl["registerController"]
        RBACMW --> InvCtrl["inventoryController"]
        RBACMW --> StockCtrl["stockRequestController"]
        RBACMW --> ShiftCtrl["shiftController"]
        RBACMW --> HandCtrl["handoverController"]
        RBACMW --> ReportCtrl["reportController"]
        RBACMW --> AdminCtrl["adminController"]
        RBACMW --> PatientCtrl["patientController"]
    end
    
    subgraph Internal Services
        TaskCtrl --> AuditSvc["auditService (Forensic Audit Logger)"]
        InvCtrl --> AuditSvc
        RegCtrl --> AuditSvc
        HandCtrl --> AuditSvc
        TaskCtrl --> NotifSvc["notificationService (In-App Dispatcher)"]
        InvCtrl --> NotifSvc
        StockCtrl --> NotifSvc
    end
    
    subgraph Database Layer
        AuthCtrl --> DB[("Relational Database (better-sqlite3 / PostgreSQL)")]
        TaskCtrl --> DB
        RegCtrl --> DB
        InvCtrl --> DB
        StockCtrl --> DB
        ShiftCtrl --> DB
        HandCtrl --> DB
        ReportCtrl --> DB
        AdminCtrl --> DB
        PatientCtrl --> DB
        AuditSvc --> DB
        NotifSvc --> DB
    end
```

---

### 2. Client-Side Architecture

The client is built using **React 19**, **TypeScript**, and **Tailwind CSS**, bundled via **Vite**.
- **State Management**: React Context providers (`AuthContext`, `ToastContext`) provide reactive state without external boilerplate.
- **Route Guards**: Protected route wrappers ensure unauthenticated requests redirect to `/login`, and unauthorized role attempts render a clinical `403 Unauthorized` view.
- **Component Architecture**: Reusable atomic components (`Button`, `Badge`, `Modal`, `Drawer`, `LoadingSkeleton`, `PageHeader`, `EmptyState`) enforce UI consistency.
- **API Communication**: The typed `api` client (`client/src/services/api.ts`) encapsulates token injection, HTTP request dispatching, and uniform error normalization.

---

### 3. Server-Side Architecture

The backend is built using **Node.js** with **Express 5** and **TypeScript (`tsx`)**:
- **Stateless Authentication**: High-entropy JWT tokens carrying user identifier, employee ID, and assigned clinical role.
- **Role-Based Access Control (RBAC)**: Declarative `requireRole(['Nurse', 'Head Nurse / Supervisor', 'Inventory Manager', 'Administrator'])` guards enforce access server-side.
- **Atomic Concurrency Protection**: High-value inventory issues and stock reconciliations execute inside atomic database transactions (`db.transaction(...)`).

---

### 4. Core Clinical Data Flows

#### Flow 1: Ward Stock Consignment Issue
```mermaid
sequenceDiagram
    autonumber
    actor Nurse as Nurse / Supervisor
    participant UI as NurseFlow Client
    participant API as Inventory Controller
    participant DB as SQLite / PostgreSQL
    participant Audit as Audit Service
    participant Notif as Notification Service

    Nurse->>UI: Submit Issue Request (Item, Batch, Qty, Target Ward)
    UI->>API: POST /api/inventory/issue
    API->>API: Verify Auth & Role Guard
    API->>DB: Query Batch Quantity (Check: quantity >= requestedQty)
    alt Insufficient Quantity
        API-->>UI: 400 Bad Request (Insufficient Stock)
    else Sufficient Quantity
        API->>DB: BEGIN TRANSACTION
        API->>DB: Decrement inventory_batches.quantity
        API->>DB: Upsert ward_inventory (increment ward stock)
        API->>DB: Insert inventory_transactions (Type: ISSUED)
        API->>DB: COMMIT TRANSACTION
        API->>Audit: logAudit(STOCK_ISSUED)
        API->>DB: Query Remaining Total Store Stock
        opt Remaining Stock <= min_stock
            API->>Notif: notifyRole('Inventory Manager', Low Stock Alert)
        end
        API-->>UI: 200 OK (Issued Successfully)
    end
```

#### Flow 2: Non-Destructive Digital Register Correction (NABH / JCI Guideline)
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Clinical Nurse
    participant API as Register Controller
    participant DB as Database
    participant Audit as Audit Service

    Staff->>API: PUT /api/registers/entries/:id/correct {data, reason}
    API->>DB: Fetch Current Version Record (Version N)
    API->>DB: BEGIN TRANSACTION
    API->>DB: Archive Version N snapshot into register_entry_history (reason, author, timestamp)
    API->>DB: Update register_entries: Set current_version = N + 1, data_json = new, status = AMENDED
    API->>DB: COMMIT TRANSACTION
    API->>Audit: logAudit(REGISTER_AMENDED)
    API-->>Staff: 200 OK (Correction Saved & History Preserved)
```

---

### 5. Future Engineering Scope
1. **Barcode / QR & RFID Scanning**: Hardware scanner integration via WebHID / WebUSB API for bedside medication verification (Five Rights).
2. **HL7 / FHIR Gateway**: Integration with hospital electronic health record (EHR) and laboratory information systems (LIS).
3. **Predictive Consumption Forecasting**: Time-series ARIMA / LSTM models predicting seasonal antibiotic and IV fluid replenishment.
