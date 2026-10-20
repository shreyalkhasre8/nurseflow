export const APP_NAME = 'NurseFlow';

export type RoleName = 'Nurse' | 'Head Nurse / Supervisor' | 'Inventory Manager' | 'Administrator';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: RoleName;
  departmentId?: string;
  departmentName?: string;
  wardId?: string;
  wardName?: string;
  phone?: string;
  qualification?: string;
  registrationNo?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  ward_count?: number;
}

export interface Ward {
  id: string;
  department_id: string;
  departmentId?: string;
  department_name?: string;
  name: string;
  code: string;
  floor?: string;
  bed_capacity: number;
  bedCapacity?: number;
  status?: string;
  active_staff_count?: number;
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TaskCategory {
  id: string;
  code: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  ward_id: string;
  ward_name?: string;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_to_emp_id?: string;
  created_by: string;
  created_by_name?: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string;
  recurrence?: 'NONE' | 'DAILY' | 'EVERY_SHIFT' | 'WEEKLY';
  patient_reference?: string;
  instructions?: string;
  completion_notes?: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  escalated?: number;
  escalated_reason?: string;
  created_at: string;
  updated_at?: string;
  comments?: TaskComment[];
  history?: TaskHistoryItem[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  employee_id: string;
  role_name?: string;
  comment: string;
  created_at: string;
}

export interface TaskHistoryItem {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  employee_id: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface RegisterTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  fieldsSchema: RegisterFieldSchema[];
  active?: number;
}

export interface RegisterFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
  required?: boolean;
}

export interface RegisterEntry {
  id: string;
  register_code: string;
  register_name?: string;
  ward_id: string;
  ward_name?: string;
  user_id: string;
  author_name?: string;
  author_emp_id?: string;
  date: string;
  data: Record<string, any>;
  status: 'FINAL' | 'AMENDED' | 'DRAFT';
  current_version: number;
  created_at: string;
  updated_at?: string;
  history?: RegisterEntryHistoryItem[];
}

export interface RegisterEntryHistoryItem {
  id: string;
  entry_id: string;
  version: number;
  user_id: string;
  edited_by_name?: string;
  edited_by_emp_id?: string;
  data: Record<string, any>;
  reason: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: 'Pharmaceuticals' | 'Consumables' | 'Surgical' | 'PPE' | 'Equipment';
  unit: string;
  min_stock: number;
  ward_id?: string;
  ward_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  cost_per_unit: number;
  description?: string;
  current_stock: number;
  active_batch_count?: number;
  earliest_expiry?: string;
  batches?: InventoryBatch[];
  transactions?: InventoryTransaction[];
}

export interface InventoryBatch {
  id: string;
  item_id: string;
  batch_number: string;
  quantity: number;
  initial_quantity: number;
  expiry_date: string;
  purchase_date?: string;
  cost_per_unit?: number;
  location_bin?: string;
  status: 'ACTIVE' | 'LOW' | 'EXPIRED' | 'QUARANTINED';
  created_at?: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  unit?: string;
  batch_id?: string;
  batch_number?: string;
  type: 'RECEIVED' | 'ISSUED' | 'RETURNED' | 'ADJUSTED';
  quantity: number;
  source?: string;
  destination?: string;
  reason?: string;
  ward_id?: string;
  ward_name?: string;
  user_id: string;
  staff_name?: string;
  staff_emp_id?: string;
  created_at: string;
}

export interface StockRequest {
  id: string;
  request_no: string;
  ward_id: string;
  ward_name?: string;
  requested_by: string;
  requested_by_name?: string;
  requester_name?: string;
  requested_by_emp_id?: string;
  status: 'Pending' | 'Approved' | 'Partially Approved' | 'Rejected' | 'Fulfilled';
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  notes?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_comment?: string;
  reviewed_at?: string;
  item_count?: number;
  total_units_requested?: number;
  created_at: string;
  items?: StockRequestItem[];
}

export interface StockRequestItem {
  id: string;
  request_id: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  unit?: string;
  quantity_requested: number;
  quantity_approved: number;
  notes?: string;
  available_store_stock?: number;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  shift_name?: string;
  shift_code?: string;
  start_time?: string;
  end_time?: string;
  user_id: string;
  staff_name?: string;
  employee_id?: string;
  role_name?: string;
  ward_id: string;
  ward_name?: string;
  department_name?: string;
  date: string;
  status: 'SCHEDULED' | 'ON_DUTY' | 'COMPLETED' | 'ABSENT' | 'SWAPPED';
  notes?: string;
}

export interface StaffAvailability {
  id: string;
  user_id: string;
  staff_name?: string;
  employee_id?: string;
  role_name?: string;
  date: string;
  status: 'AVAILABLE' | 'ON_LEAVE' | 'SICK' | 'OFF_DUTY';
  reason?: string;
}

export interface Handover {
  id: string;
  ward_id: string;
  ward_name?: string;
  shift_id: string;
  shift_name?: string;
  shift_code?: string;
  date: string;
  outgoing_nurse_id: string;
  outgoing_nurse_name?: string;
  outgoing_nurse_emp_id?: string;
  incoming_nurse_id?: string;
  incoming_nurse_name?: string;
  incoming_nurse_emp_id?: string;
  status: 'DRAFT' | 'PENDING_ACKNOWLEDGEMENT' | 'ACKNOWLEDGED' | 'INCOMPLETE';
  notes?: string;
  equipment_issues?: string;
  unresolved_incidents?: string;
  pending_task_ids?: string;
  pendingTaskIds?: string[];
  pendingTasks?: Task[];
  completed_at?: string;
  acknowledged_at?: string;
  created_at: string;
  notesList?: HandoverNote[];
}

export interface HandoverNote {
  id: string;
  handover_id: string;
  author_id: string;
  author_name?: string;
  author_emp_id?: string;
  note_type: 'GENERAL' | 'PATIENT_CARE' | 'EQUIPMENT' | 'INCIDENT' | 'ACKNOWLEDGEMENT';
  content: string;
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'TASK' | 'SHIFT' | 'HANDOVER' | 'INVENTORY' | 'SYSTEM' | 'ESCALATION';
  priority: 'Normal' | 'High' | 'Urgent';
  link?: string;
  is_read: number;
  is_acknowledged: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  employee_id?: string;
  action: string;
  entity: string;
  record_id?: string;
  details?: string;
  detailsParsed?: any;
  ip_address?: string;
  created_at: string;
}

export interface SearchResults {
  tasks: any[];
  inventory: any[];
  staff: any[];
  registers: any[];
  handovers: any[];
}
