import {
  User,
  Task,
  RegisterEntry,
  InventoryItem,
  StockRequest,
  ShiftAssignment,
  Handover,
  InAppNotification,
  AuditLog,
  SearchResults
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_WARDS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_TASKS,
  INITIAL_TEMPLATES,
  INITIAL_REGISTER_ENTRIES,
  INITIAL_INVENTORY,
  INITIAL_STOCK_REQUESTS,
  INITIAL_SHIFTS,
  INITIAL_SHIFT_ASSIGNMENTS,
  INITIAL_HANDOVERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PATIENTS,
  INITIAL_AUDIT_LOGS
} from './mockData';

// Helper to load or initialize from localStorage
function getStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(`nf_mock_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return initial;
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`nf_mock_${key}`, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

class MockStore {
  users: User[] = getStorage('users', INITIAL_USERS);
  departments = getStorage('departments', INITIAL_DEPARTMENTS);
  wards = getStorage('wards', INITIAL_WARDS);
  categories = getStorage('categories', INITIAL_CATEGORIES);
  tasks: Task[] = getStorage('tasks', INITIAL_TASKS);
  templates = getStorage('templates', INITIAL_TEMPLATES);
  registerEntries: RegisterEntry[] = getStorage('register_entries', INITIAL_REGISTER_ENTRIES);
  inventory: InventoryItem[] = getStorage('inventory', INITIAL_INVENTORY);
  stockRequests: StockRequest[] = getStorage('stock_requests', INITIAL_STOCK_REQUESTS);
  shifts = getStorage('shifts', INITIAL_SHIFTS);
  shiftAssignments: ShiftAssignment[] = getStorage('shift_assignments', INITIAL_SHIFT_ASSIGNMENTS);
  handovers: Handover[] = getStorage('handovers', INITIAL_HANDOVERS);
  notifications: InAppNotification[] = getStorage('notifications', INITIAL_NOTIFICATIONS);
  patients = getStorage('patients', INITIAL_PATIENTS);
  auditLogs: AuditLog[] = getStorage('audit_logs', INITIAL_AUDIT_LOGS);

  currentUser: User | null = null;

  constructor() {
    const token = localStorage.getItem('nurseflow_token');
    if (token) {
      try {
        const cachedUser = localStorage.getItem('nurseflow_user');
        if (cachedUser) {
          this.currentUser = JSON.parse(cachedUser);
        } else {
          this.currentUser = this.users[0];
        }
      } catch {
        this.currentUser = this.users[0];
      }
    }
  }

  save() {
    setStorage('tasks', this.tasks);
    setStorage('register_entries', this.registerEntries);
    setStorage('inventory', this.inventory);
    setStorage('stock_requests', this.stockRequests);
    setStorage('shift_assignments', this.shiftAssignments);
    setStorage('handovers', this.handovers);
    setStorage('notifications', this.notifications);
    setStorage('patients', this.patients);
    setStorage('audit_logs', this.auditLogs);
    setStorage('users', this.users);
  }
}

const store = new MockStore();

export async function handleMockApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const [path, queryString] = endpoint.split('?');
  const query = new URLSearchParams(queryString || '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth: /auth/login
  if (path === '/auth/login' && method === 'POST') {
    const { username } = body;
    const cleanUsername = (username || '').trim().toLowerCase();
    
    // Find matching user by email or employee ID
    let user = store.users.find(
      (u) =>
        u.email.toLowerCase() === cleanUsername ||
        u.employeeId.toLowerCase() === cleanUsername ||
        cleanUsername.includes(u.email.split('@')[0].toLowerCase())
    );

    if (!user) {
      // Default fallback to Sunita Rao (Supervisor) or Priya Sharma (Nurse)
      if (cleanUsername.includes('admin')) {
        user = store.users.find((u) => u.role === 'Administrator') || store.users[3];
      } else if (cleanUsername.includes('inv') || cleanUsername.includes('kumar') || cleanUsername.includes('pharm')) {
        user = store.users.find((u) => u.role === 'Inventory Manager') || store.users[2];
      } else if (cleanUsername.includes('sunita') || cleanUsername.includes('hns') || cleanUsername.includes('sup')) {
        user = store.users.find((u) => u.role === 'Head Nurse / Supervisor') || store.users[0];
      } else {
        user = store.users.find((u) => u.role === 'Nurse') || store.users[1];
      }
    }

    store.currentUser = user;
    localStorage.setItem('nurseflow_user', JSON.stringify(user));
    const token = `demo_jwt_token_${user.id}_${Date.now()}`;

    // Add audit entry
    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      user_id: user.id,
      user_name: user.name,
      employee_id: user.employeeId,
      action: 'USER_LOGIN',
      entity: 'AUTH',
      record_id: user.id,
      details: `Successful sign-in to ${user.role} role.`,
      created_at: new Date().toISOString()
    });
    store.save();

    return { token, user } as unknown as T;
  }

  // Auth: /auth/me
  if (path === '/auth/me' && method === 'GET') {
    const cachedUser = localStorage.getItem('nurseflow_user');
    if (cachedUser) {
      return JSON.parse(cachedUser) as T;
    }
    return (store.currentUser || store.users[0]) as unknown as T;
  }

  // Auth: /auth/logout
  if (path === '/auth/logout' && method === 'POST') {
    store.currentUser = null;
    localStorage.removeItem('nurseflow_user');
    return { message: 'Logged out successfully' } as unknown as T;
  }

  // Auth: /auth/demo-users
  if (path === '/auth/demo-users') {
    return store.users as unknown as T;
  }

  // Auth: /auth/forgot-password
  if (path === '/auth/forgot-password') {
    return { message: 'Password reset link dispatched to your registered email address.' } as unknown as T;
  }

  // Tasks: /tasks/categories
  if (path === '/tasks/categories') {
    return store.categories as unknown as T;
  }

  // Tasks: /tasks/my
  if (path === '/tasks/my') {
    const currentId = store.currentUser?.id || 'usr-nrs-001';
    let myTasks = store.tasks.filter((t) => t.assigned_to === currentId || t.assigned_to === 'usr-nrs-001');
    const statusFilter = query.get('status');
    if (statusFilter) {
      myTasks = myTasks.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return myTasks as unknown as T;
  }

  // Tasks: /tasks/all
  if (path === '/tasks/all') {
    let all = [...store.tasks];
    const statusFilter = query.get('status');
    const priorityFilter = query.get('priority');
    const wardFilter = query.get('wardId');
    if (statusFilter) all = all.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
    if (priorityFilter) all = all.filter((t) => t.priority.toLowerCase() === priorityFilter.toLowerCase());
    if (wardFilter) all = all.filter((t) => t.ward_id === wardFilter);
    return all as unknown as T;
  }

  // Tasks: /tasks/:id/status
  if (path.match(/^\/tasks\/([^/]+)\/status$/) && method === 'PATCH') {
    const taskId = path.split('/')[2];
    const task = store.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = body.status;
      if (body.completionNotes) task.completion_notes = body.completionNotes;
      if (body.status === 'Completed') {
        task.completed_at = new Date().toISOString();
        task.completed_by = store.currentUser?.id;
        task.completed_by_name = store.currentUser?.name;
      }
      store.save();
    }
    return { message: 'Task status updated successfully' } as unknown as T;
  }

  // Tasks: /tasks/:id/reassign
  if (path.match(/^\/tasks\/([^/]+)\/reassign$/) && method === 'PATCH') {
    const taskId = path.split('/')[2];
    const task = store.tasks.find((t) => t.id === taskId);
    if (task) {
      const newUser = store.users.find((u) => u.id === body.newAssignedTo);
      task.assigned_to = body.newAssignedTo;
      task.assigned_to_name = newUser ? newUser.name : 'Assigned Nurse';
      store.save();
    }
    return { message: 'Task reassigned successfully' } as unknown as T;
  }

  // Tasks: /tasks/:id/escalate
  if (path.match(/^\/tasks\/([^/]+)\/escalate$/) && method === 'PATCH') {
    const taskId = path.split('/')[2];
    const task = store.tasks.find((t) => t.id === taskId);
    if (task) {
      task.escalated = 1;
      task.escalated_reason = body.reason || 'Escalated by supervisor';
      store.save();
    }
    return { message: 'Task escalated successfully' } as unknown as T;
  }

  // Tasks: /tasks/:id/comments
  if (path.match(/^\/tasks\/([^/]+)\/comments$/) && method === 'POST') {
    const taskId = path.split('/')[2];
    const task = store.tasks.find((t) => t.id === taskId);
    const newComment = {
      id: `cm-${Date.now()}`,
      task_id: taskId,
      user_id: store.currentUser?.id || 'usr-hns-001',
      user_name: store.currentUser?.name || 'Charge Nurse',
      employee_id: store.currentUser?.employeeId || 'EMP-HNS',
      comment: body.comment,
      created_at: new Date().toISOString()
    };
    if (task) {
      if (!task.comments) task.comments = [];
      task.comments.push(newComment);
      store.save();
    }
    return { id: newComment.id, message: 'Comment added' } as unknown as T;
  }

  // Tasks: /tasks/:id
  if (path.match(/^\/tasks\/[^/]+$/) && method === 'GET') {
    const taskId = path.split('/')[2];
    const task = store.tasks.find((t) => t.id === taskId) || store.tasks[0];
    return task as unknown as T;
  }

  // Tasks: /tasks (POST create)
  if (path === '/tasks' && method === 'POST') {
    const category = store.categories.find((c) => c.id === body.category_id);
    const ward = store.wards.find((w) => w.id === body.ward_id);
    const assigned = store.users.find((u) => u.id === body.assigned_to);
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      title: body.title,
      description: body.description,
      category_id: body.category_id,
      category_name: category ? category.name : 'General Care',
      category_color: category ? category.color : 'teal',
      category_icon: category ? category.icon : 'Activity',
      ward_id: body.ward_id,
      ward_name: ward ? ward.name : 'Medical ICU',
      assigned_to: body.assigned_to,
      assigned_to_name: assigned ? assigned.name : 'Assigned Nurse',
      assigned_to_emp_id: assigned ? assigned.employeeId : 'EMP-01',
      created_by: store.currentUser?.id || 'usr-hns-001',
      created_by_name: store.currentUser?.name || 'Sunita Rao',
      priority: body.priority || 'Medium',
      status: 'Pending',
      due_date: body.due_date || new Date(Date.now() + 3600000).toISOString(),
      patient_reference: body.patient_reference,
      instructions: body.instructions,
      escalated: 0,
      created_at: new Date().toISOString()
    };
    store.tasks.unshift(newTask);
    store.save();
    return { id: newTask.id, message: 'Task assigned successfully' } as unknown as T;
  }

  // Registers: /registers/templates
  if (path === '/registers/templates') {
    return store.templates as unknown as T;
  }

  // Registers: /registers/entries/:id/correct
  if (path.match(/^\/registers\/entries\/([^/]+)\/correct$/) && method === 'PUT') {
    const entryId = path.split('/')[3];
    const entry = store.registerEntries.find((e) => e.id === entryId);
    if (entry) {
      if (!entry.history) entry.history = [];
      entry.history.unshift({
        id: `rgh-${Date.now()}`,
        entry_id: entry.id,
        version: entry.current_version,
        user_id: store.currentUser?.id || 'usr-nrs-001',
        edited_by_name: store.currentUser?.name || 'Staff Nurse',
        edited_by_emp_id: store.currentUser?.employeeId || 'EMP',
        data: { ...entry.data },
        reason: body.reason || 'Clinical record amendment',
        created_at: new Date().toISOString()
      });
      entry.data = { ...entry.data, ...body.data };
      entry.current_version += 1;
      entry.status = 'AMENDED';
      store.save();
    }
    return { message: 'Register entry amended with audit trail' } as unknown as T;
  }

  // Registers: /registers/entries/:id
  if (path.match(/^\/registers\/entries\/[^/]+$/) && method === 'GET') {
    const entryId = path.split('/')[3];
    const entry = store.registerEntries.find((e) => e.id === entryId) || store.registerEntries[0];
    return entry as unknown as T;
  }

  // Registers: /registers/entries
  if (path === '/registers/entries') {
    if (method === 'POST') {
      const template = store.templates.find((t) => t.code === body.registerCode);
      const ward = store.wards.find((w) => w.id === body.wardId);
      const newEntry: RegisterEntry = {
        id: `reg-${Date.now()}`,
        register_code: body.registerCode,
        register_name: template ? template.name : 'Digital Nursing Register',
        ward_id: body.wardId,
        ward_name: ward ? ward.name : 'Inpatient Ward',
        user_id: store.currentUser?.id || 'usr-nrs-001',
        author_name: store.currentUser?.name || 'Staff Nurse',
        author_emp_id: store.currentUser?.employeeId || 'EMP',
        date: body.date || new Date().toISOString().split('T')[0],
        status: 'FINAL',
        current_version: 1,
        created_at: new Date().toISOString(),
        data: body.data || {}
      };
      store.registerEntries.unshift(newEntry);
      store.save();
      return { id: newEntry.id, message: 'Digital register entry recorded' } as unknown as T;
    }
    let entries = [...store.registerEntries];
    const code = query.get('registerCode');
    const wardId = query.get('wardId');
    if (code) entries = entries.filter((e) => e.register_code === code);
    if (wardId) entries = entries.filter((e) => e.ward_id === wardId);
    return entries as unknown as T;
  }

  // Inventory: /inventory/metrics
  if (path === '/inventory/metrics') {
    const totalItems = store.inventory.length;
    const lowStockCount = store.inventory.filter((i) => i.current_stock <= i.min_stock).length;
    const nearExpiryCount = store.inventory.filter((i) => {
      if (!i.earliest_expiry) return false;
      const diff = new Date(i.earliest_expiry).getTime() - Date.now();
      return diff > 0 && diff < 60 * 24 * 3600 * 1000;
    }).length;
    return {
      totalItems,
      lowStockCount,
      nearExpiryCount,
      pendingRequestsCount: store.stockRequests.filter((r) => r.status === 'Pending').length,
      totalValuation: 486200
    } as unknown as T;
  }

  // Inventory: /inventory/items
  if (path === '/inventory/items') {
    if (method === 'POST') {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        code: body.code,
        name: body.name,
        category: body.category || 'Pharmaceuticals',
        unit: body.unit || 'Piece',
        min_stock: Number(body.min_stock) || 20,
        current_stock: Number(body.current_stock) || 0,
        cost_per_unit: Number(body.cost_per_unit) || 10,
        active_batch_count: 1,
        earliest_expiry: body.expiry_date || '2028-01-01',
        batches: [
          {
            id: `b-${Date.now()}`,
            item_id: `inv-${Date.now()}`,
            batch_number: body.batch_number || 'LOT-2026-01',
            quantity: Number(body.current_stock) || 0,
            initial_quantity: Number(body.current_stock) || 0,
            expiry_date: body.expiry_date || '2028-01-01',
            status: 'ACTIVE'
          }
        ]
      };
      store.inventory.push(newItem);
      store.save();
      return { id: newItem.id, message: 'Stock item added to catalog' } as unknown as T;
    }
    let items = [...store.inventory];
    const category = query.get('category');
    const status = query.get('status');
    if (category) items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    if (status === 'LOW_STOCK') items = items.filter((i) => i.current_stock <= i.min_stock);
    return items as unknown as T;
  }

  // Inventory: /inventory/items/:id
  if (path.match(/^\/inventory\/items\/[^/]+$/) && method === 'GET') {
    const itemId = path.split('/')[3];
    const item = store.inventory.find((i) => i.id === itemId) || store.inventory[0];
    return item as unknown as T;
  }

  // Inventory: transactions (receive / issue / return / adjust)
  if (path === '/inventory/receive' && method === 'POST') {
    const item = store.inventory.find((i) => i.id === body.itemId);
    if (item) {
      item.current_stock += Number(body.quantity || 0);
      store.save();
    }
    return { message: 'Stock receipt recorded successfully' } as unknown as T;
  }

  if (path === '/inventory/issue' && method === 'POST') {
    const item = store.inventory.find((i) => i.id === body.itemId);
    if (item) {
      item.current_stock = Math.max(0, item.current_stock - Number(body.quantity || 0));
      store.save();
    }
    return { message: 'Stock issued to clinical ward' } as unknown as T;
  }

  if (path === '/inventory/return' && method === 'POST') {
    return { message: 'Stock return processed' } as unknown as T;
  }

  if (path === '/inventory/adjust' && method === 'POST') {
    const item = store.inventory.find((i) => i.id === body.itemId);
    if (item && body.adjustedQuantity !== undefined) {
      item.current_stock = Number(body.adjustedQuantity);
      store.save();
    }
    return { message: 'Inventory audit adjustment saved' } as unknown as T;
  }

  if (path === '/inventory/transactions') {
    return [
      { id: 'tx-1', item_name: 'Normal Saline 0.9% 500ml', type: 'RECEIVED', quantity: 200, created_at: new Date(Date.now() - 3600000).toISOString(), staff_name: 'Rajesh Kumar' },
      { id: 'tx-2', item_name: 'Ceftriaxone 1g IV', type: 'ISSUED', quantity: 15, ward_name: 'Medical ICU', created_at: new Date(Date.now() - 7200000).toISOString(), staff_name: 'Priya Sharma' },
      { id: 'tx-3', item_name: 'Enoxaparin 40mg', type: 'ISSUED', quantity: 6, ward_name: 'Medical ICU', created_at: new Date(Date.now() - 10800000).toISOString(), staff_name: 'Sunita Rao' }
    ] as unknown as T;
  }

  // Stock Requests
  if (path === '/stock-requests') {
    if (method === 'POST') {
      const ward = store.wards.find((w) => w.id === body.wardId);
      const newReq: StockRequest = {
        id: `req-${Date.now()}`,
        request_no: `REQ-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
        ward_id: body.wardId || 'ward-micu',
        ward_name: ward ? ward.name : 'Inpatient Ward',
        requested_by: store.currentUser?.id || 'usr-nrs-001',
        requested_by_name: store.currentUser?.name || 'Staff Nurse',
        requester_name: store.currentUser?.name || 'Staff Nurse',
        requested_by_emp_id: store.currentUser?.employeeId || 'EMP',
        status: 'Pending',
        urgency: body.urgency || 'Normal',
        notes: body.notes,
        item_count: (body.items || []).length,
        total_units_requested: (body.items || []).reduce((acc: number, cur: any) => acc + (cur.quantity || 0), 0),
        created_at: new Date().toISOString(),
        items: (body.items || []).map((it: any, idx: number) => ({
          id: `ri-${Date.now()}-${idx}`,
          request_id: `req-${Date.now()}`,
          item_id: it.itemId,
          item_name: it.itemName || 'Requested Drug / Item',
          quantity_requested: Number(it.quantity) || 10,
          quantity_approved: 0,
          unit: 'Unit'
        }))
      };
      store.stockRequests.unshift(newReq);
      store.save();
      return { id: newReq.id, requestNo: newReq.request_no, message: 'Stock request submitted for pharmacy approval' } as unknown as T;
    }
    let requests = [...store.stockRequests];
    const status = query.get('status');
    if (status) requests = requests.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    return requests as unknown as T;
  }

  if (path.match(/^\/stock-requests\/([^/]+)\/review$/) && method === 'PATCH') {
    const reqId = path.split('/')[2];
    const req = store.stockRequests.find((r) => r.id === reqId);
    if (req) {
      req.status = body.status;
      req.review_comment = body.reviewComment;
      req.reviewed_by = store.currentUser?.id;
      req.reviewed_by_name = store.currentUser?.name;
      req.reviewed_at = new Date().toISOString();
      store.save();
    }
    return { message: 'Stock request decision recorded' } as unknown as T;
  }

  if (path.match(/^\/stock-requests\/[^/]+$/) && method === 'GET') {
    const reqId = path.split('/')[2];
    const req = store.stockRequests.find((r) => r.id === reqId) || store.stockRequests[0];
    return req as unknown as T;
  }

  // Shifts
  if (path === '/shifts/types') {
    return store.shifts as unknown as T;
  }

  if (path === '/shifts/assignments') {
    return store.shiftAssignments as unknown as T;
  }

  if (path === '/shifts/assign' && method === 'POST') {
    const staff = store.users.find((u) => u.id === body.userId);
    const ward = store.wards.find((w) => w.id === body.wardId);
    const shift = store.shifts.find((s) => s.id === body.shiftId);
    const newAssignment: ShiftAssignment = {
      id: `sa-${Date.now()}`,
      shift_id: body.shiftId,
      shift_name: shift ? shift.name : 'Shift',
      shift_code: shift ? shift.code : 'DUTY',
      user_id: body.userId,
      staff_name: staff ? staff.name : 'Nurse',
      employee_id: staff ? staff.employeeId : 'EMP',
      role_name: staff ? staff.role : 'Nurse',
      ward_id: body.wardId,
      ward_name: ward ? ward.name : 'Ward',
      date: body.date || new Date().toISOString().split('T')[0],
      status: 'SCHEDULED',
      notes: body.notes
    };
    store.shiftAssignments.push(newAssignment);
    store.save();
    return { id: newAssignment.id, message: 'Shift allocated' } as unknown as T;
  }

  if (path === '/shifts/availability') {
    return [
      { id: 'av-1', user_id: 'usr-nrs-001', staff_name: 'Priya Sharma', employee_id: 'NF-NUR-101', role_name: 'Nurse', date: new Date().toISOString().split('T')[0], status: 'AVAILABLE' },
      { id: 'av-2', user_id: 'usr-hns-001', staff_name: 'Sunita Rao', employee_id: 'NF-HNS-002', role_name: 'Head Nurse / Supervisor', date: new Date().toISOString().split('T')[0], status: 'AVAILABLE' }
    ] as unknown as T;
  }

  // Handovers
  if (path === '/handovers') {
    if (method === 'POST') {
      const ward = store.wards.find((w) => w.id === body.wardId);
      const shift = store.shifts.find((s) => s.id === body.shiftId);
      const newHandover: Handover = {
        id: `hnd-${Date.now()}`,
        ward_id: body.wardId || 'ward-micu',
        ward_name: ward ? ward.name : 'Medical ICU',
        shift_id: body.shiftId || 'shift-m',
        shift_name: shift ? shift.name : 'Morning Shift',
        shift_code: shift ? shift.code : 'MORNING',
        date: new Date().toISOString().split('T')[0],
        outgoing_nurse_id: store.currentUser?.id || 'usr-nrs-001',
        outgoing_nurse_name: store.currentUser?.name || 'Staff Nurse',
        outgoing_nurse_emp_id: store.currentUser?.employeeId || 'EMP',
        status: 'PENDING_ACKNOWLEDGEMENT',
        notes: body.notes || 'ISBAR clinical care transition summary logged.',
        equipment_issues: body.equipmentIssues,
        unresolved_incidents: body.unresolvedIncidents,
        created_at: new Date().toISOString()
      };
      store.handovers.unshift(newHandover);
      store.save();
      return { id: newHandover.id, message: 'ISBAR Shift handover submitted for incoming sign-off' } as unknown as T;
    }
    return store.handovers as unknown as T;
  }

  if (path.match(/^\/handovers\/([^/]+)\/acknowledge$/) && method === 'PATCH') {
    const hndId = path.split('/')[2];
    const hnd = store.handovers.find((h) => h.id === hndId);
    if (hnd) {
      hnd.status = 'ACKNOWLEDGED';
      hnd.incoming_nurse_id = store.currentUser?.id;
      hnd.incoming_nurse_name = store.currentUser?.name;
      hnd.acknowledged_at = new Date().toISOString();
      store.save();
    }
    return { message: 'Shift handover signed and acknowledged' } as unknown as T;
  }

  if (path.match(/^\/handovers\/[^/]+$/) && method === 'GET') {
    const hndId = path.split('/')[2];
    const hnd = store.handovers.find((h) => h.id === hndId) || store.handovers[0];
    return hnd as unknown as T;
  }

  // Notifications
  if (path === '/notifications') {
    const unreadCount = store.notifications.filter((n) => n.is_read === 0).length;
    return { notifications: store.notifications, unreadCount } as unknown as T;
  }

  if (path.match(/^\/notifications\/([^/]+)\/read$/) && method === 'PATCH') {
    const notifId = path.split('/')[2];
    const n = store.notifications.find((notif) => notif.id === notifId);
    if (n) {
      n.is_read = 1;
      store.save();
    }
    return { message: 'Notification marked read' } as unknown as T;
  }

  if (path === '/notifications/mark-all-read' && method === 'POST') {
    store.notifications.forEach((n) => (n.is_read = 1));
    store.save();
    return { message: 'All notifications marked as read' } as unknown as T;
  }

  // Reports
  if (path === '/reports/task-summary') {
    const total = store.tasks.length;
    const completed = store.tasks.filter((t) => t.status === 'Completed').length;
    const pending = store.tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = store.tasks.filter((t) => t.status === 'In Progress').length;
    const overdue = store.tasks.filter((t) => t.status !== 'Completed' && new Date(t.due_date).getTime() < Date.now()).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      summary: { total, completed, pending, inProgress, overdue, completionRate },
      byPriority: [
        { priority: 'Urgent', count: store.tasks.filter((t) => t.priority === 'Urgent').length },
        { priority: 'High', count: store.tasks.filter((t) => t.priority === 'High').length },
        { priority: 'Medium', count: store.tasks.filter((t) => t.priority === 'Medium').length },
        { priority: 'Low', count: store.tasks.filter((t) => t.priority === 'Low').length }
      ],
      byCategory: store.categories.map((c) => ({
        category: c.name,
        count: store.tasks.filter((t) => t.category_id === c.id).length
      }))
    } as unknown as T;
  }

  if (path === '/reports/workload') {
    return [
      { nurse_id: 'usr-nrs-001', nurse_name: 'Priya Sharma', ward_name: 'Medical ICU', total_tasks: 7, completed_tasks: 3, pending_tasks: 4, completion_percentage: 43 },
      { nurse_id: 'usr-hns-001', nurse_name: 'Sunita Rao', ward_name: 'Medical ICU', total_tasks: 5, completed_tasks: 4, pending_tasks: 1, completion_percentage: 80 }
    ] as unknown as T;
  }

  if (path === '/reports/inventory-consumption') {
    return [
      { item_name: 'Normal Saline 0.9% 500ml', unit: 'Bottle', total_issued: 85, ward_name: 'Medical ICU' },
      { item_name: 'Ceftriaxone 1g IV', unit: 'Vial', total_issued: 42, ward_name: 'Medical ICU' },
      { item_name: 'Enoxaparin 40mg', unit: 'Syringe', total_issued: 28, ward_name: 'Medical ICU' },
      { item_name: 'Disposable Syringes 5ml', unit: 'Piece', total_issued: 160, ward_name: 'Medical ICU' }
    ] as unknown as T;
  }

  if (path === '/reports/handover-compliance') {
    return [
      { ward_name: 'Medical ICU (MICU)', total_handovers: 14, acknowledged_handovers: 13, compliance_rate: 93 },
      { ward_name: 'Surgical ICU (SICU)', total_handovers: 12, acknowledged_handovers: 11, compliance_rate: 92 },
      { ward_name: 'Male Medical Ward', total_handovers: 14, acknowledged_handovers: 14, compliance_rate: 100 }
    ] as unknown as T;
  }

  if (path === '/reports/overdue-tasks') {
    const overdue = store.tasks.filter((t) => t.status !== 'Completed' && new Date(t.due_date).getTime() < Date.now());
    return overdue as unknown as T;
  }

  if (path === '/reports/inventory-alerts') {
    const lowStockItems = store.inventory.filter((i) => i.current_stock <= i.min_stock);
    const nearExpiryBatches = store.inventory
      .filter((i) => {
        if (!i.earliest_expiry) return false;
        const diff = new Date(i.earliest_expiry).getTime() - Date.now();
        return diff > 0 && diff < 60 * 24 * 3600 * 1000;
      })
      .map((i) => ({
        item_name: i.name,
        batch_number: i.batches?.[0]?.batch_number || 'LOT-26',
        expiry_date: i.earliest_expiry,
        quantity: i.current_stock
      }));
    return { lowStockItems, nearExpiryBatches, expiredBatches: [] } as unknown as T;
  }

  if (path === '/reports/stock-movement') {
    return {
      summaryByType: [
        { type: 'RECEIVED', total_transactions: 18, total_quantity: 1240 },
        { type: 'ISSUED', total_transactions: 42, total_quantity: 495 }
      ],
      recentMovements: [
        { id: 'mv-1', item_name: 'Normal Saline 0.9%', type: 'RECEIVED', quantity: 200, created_at: new Date().toISOString() },
        { id: 'mv-2', item_name: 'Ceftriaxone 1g', type: 'ISSUED', quantity: 10, created_at: new Date().toISOString() }
      ]
    } as unknown as T;
  }

  // Patients
  if (path === '/patients') {
    return store.patients as unknown as T;
  }

  if (path.match(/^\/patients\/[^/]+$/) && method === 'GET') {
    const ptId = path.split('/')[2];
    const pt = store.patients.find((p) => p.id === ptId || p.uhid === ptId) || store.patients[0];
    return pt as unknown as T;
  }

  // Admin
  if (path === '/admin/users') {
    return store.users as unknown as T;
  }

  if (path === '/admin/audit-logs') {
    return store.auditLogs as unknown as T;
  }

  if (path === '/admin/departments') {
    return store.departments as unknown as T;
  }

  if (path === '/admin/wards') {
    return store.wards as unknown as T;
  }

  if (path === '/admin/roles') {
    return [
      { id: 'role-nurse', name: 'Nurse' },
      { id: 'role-supervisor', name: 'Head Nurse / Supervisor' },
      { id: 'role-inventory', name: 'Inventory Manager' },
      { id: 'role-admin', name: 'Administrator' }
    ] as unknown as T;
  }

  // Global search
  if (path === '/search') {
    const q = (query.get('q') || '').toLowerCase();
    const tasks = store.tasks.filter((t) => t.title.toLowerCase().includes(q) || (t.patient_reference && t.patient_reference.toLowerCase().includes(q)));
    const inventory = store.inventory.filter((i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
    const staff = store.users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    const registers = store.registerEntries.filter((r) => r.register_name?.toLowerCase().includes(q));
    const handovers = store.handovers.filter((h) => h.notes?.toLowerCase().includes(q));
    return { tasks, inventory, staff, registers, handovers } as unknown as SearchResults as unknown as T;
  }

  // Default fallback for any unhandled GET/POST
  return {} as T;
}
