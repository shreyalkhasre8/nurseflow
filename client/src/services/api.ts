import {
  User,
  Task,
  TaskCategory,
  RegisterTemplate,
  RegisterEntry,
  InventoryItem,
  StockRequest,
  Shift,
  ShiftAssignment,
  StaffAvailability,
  Handover,
  InAppNotification,
  AuditLog,
  Department,
  Ward,
  SearchResults
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nurseflow_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Only redirect if not already on login
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('nurseflow_token');
      localStorage.removeItem('nurseflow_user');
      window.dispatchEvent(new Event('nurseflow:session_expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'A clinical server error occurred', response.status);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getCurrentUser: () => request<User>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getDemoUsers: () => request<any[]>('/auth/demo-users'),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Tasks
  getCategories: () => request<TaskCategory[]>('/tasks/categories'),
  getMyTasks: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Task[]>(`/tasks/my${query ? `?${query}` : ''}`);
  },
  getAllTasks: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Task[]>(`/tasks/all${query ? `?${query}` : ''}`);
  },
  getTaskById: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) =>
    request<{ id: string; message: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<{ message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id: string, status: string, completionNotes?: string) =>
    request<{ message: string }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, completionNotes }),
    }),
  reassignTask: (id: string, newAssignedTo: string, reason?: string) =>
    request<{ message: string }>(`/tasks/${id}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ newAssignedTo, reason }),
    }),
  escalateTask: (id: string, reason: string) =>
    request<{ message: string }>(`/tasks/${id}/escalate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  addTaskComment: (id: string, comment: string) =>
    request<{ id: string; message: string }>(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  // Registers
  getRegisterTemplates: () => request<RegisterTemplate[]>('/registers/templates'),
  getRegisterEntries: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<RegisterEntry[]>(`/registers/entries${query ? `?${query}` : ''}`);
  },
  getRegisterEntryById: (id: string) => request<RegisterEntry>(`/registers/entries/${id}`),
  createRegisterEntry: (data: { registerCode: string; wardId: string; date?: string; data: Record<string, any> }) =>
    request<{ id: string; message: string }>('/registers/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRegisterCorrection: (id: string, data: Record<string, any>, reason: string) =>
    request<{ message: string }>(`/registers/entries/${id}/correct`, {
      method: 'PUT',
      body: JSON.stringify({ data, reason }),
    }),

  // Inventory
  getInventoryMetrics: () => request<any>('/inventory/metrics'),
  getInventoryItems: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<InventoryItem[]>(`/inventory/items${query ? `?${query}` : ''}`);
  },
  getItemById: (id: string) => request<InventoryItem>(`/inventory/items/${id}`),
  addItem: (data: any) =>
    request<{ id: string; message: string }>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  receiveStock: (data: any) =>
    request<{ message: string }>('/inventory/receive', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  issueStock: (data: any) =>
    request<{ message: string }>('/inventory/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  returnStock: (data: any) =>
    request<{ message: string }>('/inventory/return', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adjustStock: (data: any) =>
    request<{ message: string }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInventoryTransactions: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/inventory/transactions${query ? `?${query}` : ''}`);
  },

  // Stock Requests
  getStockRequests: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<StockRequest[]>(`/stock-requests${query ? `?${query}` : ''}`);
  },
  getStockRequestById: (id: string) => request<StockRequest>(`/stock-requests/${id}`),
  createStockRequest: (data: any) =>
    request<{ id: string; requestNo: string; message: string }>('/stock-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviewStockRequest: (id: string, status: string, reviewComment?: string, approvedItems?: any[]) =>
    request<{ message: string }>(`/stock-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewComment, approvedItems }),
    }),

  // Shifts
  getShiftTypes: () => request<Shift[]>('/shifts/types'),
  getShiftAssignments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<ShiftAssignment[]>(`/shifts/assignments${query ? `?${query}` : ''}`);
  },
  assignShift: (data: any) =>
    request<{ id: string; message: string }>('/shifts/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAssignmentStatus: (id: string, status: string) =>
    request<{ message: string }>(`/shifts/assignments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getStaffAvailability: (date?: string) =>
    request<StaffAvailability[]>(`/shifts/availability${date ? `?date=${date}` : ''}`),
  setStaffAvailability: (data: any) =>
    request<{ message: string }>('/shifts/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Handovers
  getHandovers: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<Handover[]>(`/handovers${query ? `?${query}` : ''}`);
  },
  getHandoverById: (id: string) => request<Handover>(`/handovers/${id}`),
  createHandover: (data: any) =>
    request<{ id: string; message: string }>('/handovers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  acknowledgeHandover: (id: string, acknowledgmentNote?: string) =>
    request<{ message: string }>(`/handovers/${id}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ acknowledgmentNote }),
    }),
  flagIncompleteHandover: (id: string, reason?: string) =>
    request<{ message: string }>(`/handovers/${id}/flag-incomplete`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  // Notifications
  getNotifications: () => request<{ notifications: InAppNotification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),
  acknowledgeNotification: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/acknowledge`, { method: 'PATCH' }),
  deleteNotification: (id: string) =>
    request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),

  // Reports
  getTaskSummaryReport: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/reports/task-summary${query ? `?${query}` : ''}`);
  },
  getWorkloadReport: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/reports/workload${query ? `?${query}` : ''}`);
  },
  getInventoryConsumptionReport: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/reports/inventory-consumption${query ? `?${query}` : ''}`);
  },
  getHandoverComplianceReport: () => request<any[]>('/reports/handover-compliance'),

  // Admin
  getUsers: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<User[]>(`/admin/users${query ? `?${query}` : ''}`);
  },
  createUser: (data: any) =>
    request<{ id: string; message: string }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<{ message: string }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetUserPassword: (id: string, newPassword?: string) =>
    request<{ message: string }>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  getAuditLogs: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<AuditLog[]>(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },
  getDepartments: () => request<Department[]>('/admin/departments'),
  getWards: (departmentId?: string) =>
    request<Ward[]>(`/admin/wards${departmentId ? `?departmentId=${departmentId}` : ''}`),
  getRoles: () => request<any[]>('/admin/roles'),

  // Search
  globalSearch: (q: string) => request<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
};
