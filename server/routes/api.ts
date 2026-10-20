import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as authController from '../controllers/authController.js';
import * as taskController from '../controllers/taskController.js';
import * as registerController from '../controllers/registerController.js';
import * as inventoryController from '../controllers/inventoryController.js';
import * as stockRequestController from '../controllers/stockRequestController.js';
import * as shiftController from '../controllers/shiftController.js';
import * as handoverController from '../controllers/handoverController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as reportController from '../controllers/reportController.js';
import * as adminController from '../controllers/adminController.js';
import * as searchController from '../controllers/searchController.js';

export const apiRouter = Router();

// === Authentication ===
apiRouter.post('/auth/login', authController.login);
apiRouter.get('/auth/me', authenticate, authController.getCurrentUser);
apiRouter.post('/auth/logout', authenticate, authController.logout);
apiRouter.get('/auth/demo-users', authController.getDemoUsers);
apiRouter.post('/auth/forgot-password', authController.forgotPassword);

// === Tasks ===
apiRouter.get('/tasks/categories', authenticate, taskController.getCategories);
apiRouter.get('/tasks/my', authenticate, taskController.getMyTasks);
apiRouter.get('/tasks/all', authenticate, taskController.getAllTasks);
apiRouter.get('/tasks/:id', authenticate, taskController.getTaskById);
apiRouter.post('/tasks', authenticate, taskController.createTask);
apiRouter.put('/tasks/:id', authenticate, taskController.updateTask);
apiRouter.patch('/tasks/:id/status', authenticate, taskController.updateTaskStatus);
apiRouter.patch('/tasks/:id/reassign', authenticate, taskController.reassignTask);
apiRouter.patch('/tasks/:id/escalate', authenticate, taskController.escalateTask);
apiRouter.post('/tasks/:id/comments', authenticate, taskController.addTaskComment);

// === Registers ===
apiRouter.get('/registers/templates', authenticate, registerController.getRegisterTemplates);
apiRouter.get('/registers/entries', authenticate, registerController.getRegisterEntries);
apiRouter.get('/registers/entries/:id', authenticate, registerController.getRegisterEntryById);
apiRouter.post('/registers/entries', authenticate, registerController.createRegisterEntry);
apiRouter.put('/registers/entries/:id/correct', authenticate, registerController.updateRegisterCorrection);

// === Inventory ===
apiRouter.get('/inventory/metrics', authenticate, inventoryController.getInventoryMetrics);
apiRouter.get('/inventory/items', authenticate, inventoryController.getInventoryItems);
apiRouter.get('/inventory/items/:id', authenticate, inventoryController.getItemById);
apiRouter.post('/inventory/items', authenticate, requireRole(['Inventory Manager', 'Administrator']), inventoryController.addItem);
apiRouter.post('/inventory/receive', authenticate, requireRole(['Inventory Manager', 'Administrator']), inventoryController.receiveStock);
apiRouter.post('/inventory/issue', authenticate, requireRole(['Inventory Manager', 'Head Nurse / Supervisor', 'Administrator']), inventoryController.issueStock);
apiRouter.post('/inventory/return', authenticate, requireRole(['Inventory Manager', 'Head Nurse / Supervisor', 'Administrator']), inventoryController.returnStock);
apiRouter.post('/inventory/adjust', authenticate, requireRole(['Inventory Manager', 'Administrator']), inventoryController.adjustStock);
apiRouter.get('/inventory/transactions', authenticate, inventoryController.getTransactions);

// === Stock Requests ===
apiRouter.get('/stock-requests', authenticate, stockRequestController.getStockRequests);
apiRouter.get('/stock-requests/:id', authenticate, stockRequestController.getStockRequestById);
apiRouter.post('/stock-requests', authenticate, stockRequestController.createStockRequest);
apiRouter.patch('/stock-requests/:id/review', authenticate, requireRole(['Inventory Manager', 'Head Nurse / Supervisor', 'Administrator']), stockRequestController.reviewStockRequest);

// === Shifts ===
apiRouter.get('/shifts/types', authenticate, shiftController.getShifts);
apiRouter.get('/shifts/assignments', authenticate, shiftController.getShiftAssignments);
apiRouter.post('/shifts/assign', authenticate, requireRole(['Head Nurse / Supervisor', 'Administrator']), shiftController.assignShift);
apiRouter.patch('/shifts/assignments/:id/status', authenticate, shiftController.updateAssignmentStatus);
apiRouter.get('/shifts/availability', authenticate, shiftController.getStaffAvailability);
apiRouter.post('/shifts/availability', authenticate, shiftController.setStaffAvailability);

// === Handovers ===
apiRouter.get('/handovers', authenticate, handoverController.getHandovers);
apiRouter.get('/handovers/:id', authenticate, handoverController.getHandoverById);
apiRouter.post('/handovers', authenticate, handoverController.createHandover);
apiRouter.patch('/handovers/:id/acknowledge', authenticate, handoverController.acknowledgeHandover);
apiRouter.patch('/handovers/:id/flag-incomplete', authenticate, handoverController.flagIncompleteHandover);

// === Notifications ===
apiRouter.get('/notifications', authenticate, notificationController.getNotifications);
apiRouter.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);
apiRouter.post('/notifications/mark-all-read', authenticate, notificationController.markAllAsRead);
apiRouter.patch('/notifications/:id/acknowledge', authenticate, notificationController.acknowledgeNotification);
apiRouter.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// === Reports ===
apiRouter.get('/reports/task-summary', authenticate, reportController.getTaskSummaryReport);
apiRouter.get('/reports/workload', authenticate, reportController.getWorkloadReport);
apiRouter.get('/reports/inventory-consumption', authenticate, reportController.getInventoryConsumptionReport);
apiRouter.get('/reports/handover-compliance', authenticate, reportController.getHandoverComplianceReport);

// === Administration & System Metadata ===
apiRouter.get('/admin/users', authenticate, adminController.getUsers);
apiRouter.post('/admin/users', authenticate, requireRole(['Administrator']), adminController.createUser);
apiRouter.put('/admin/users/:id', authenticate, requireRole(['Administrator']), adminController.updateUser);
apiRouter.post('/admin/users/:id/reset-password', authenticate, requireRole(['Administrator']), adminController.resetPassword);
apiRouter.get('/admin/audit-logs', authenticate, requireRole(['Administrator', 'Head Nurse / Supervisor']), adminController.getAuditLogs);
apiRouter.get('/admin/departments', authenticate, adminController.getDepartments);
apiRouter.get('/admin/wards', authenticate, adminController.getWards);
apiRouter.get('/admin/roles', authenticate, adminController.getRoles);

// === Global Search ===
apiRouter.get('/search', authenticate, searchController.globalSearch);
