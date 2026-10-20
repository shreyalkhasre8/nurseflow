import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { RegistersPage } from './pages/registers/RegistersPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { HandoverPage } from './pages/handover/HandoverPage';
import { ShiftsPage } from './pages/shifts/ShiftsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { StaffPage } from './pages/staff/StaffPage';
import { AdminPage } from './pages/admin/AdminPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { UnauthorizedPage } from './pages/errors/UnauthorizedPage';
import { RoleName } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: RoleName[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading NurseFlow Clinical Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Dashboard Shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="registers" element={<RegistersPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="handover" element={<HandoverPage />} />
              <Route
                path="shifts"
                element={
                  <ProtectedRoute allowedRoles={['Head Nurse / Supervisor', 'Administrator']}>
                    <ShiftsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['Head Nurse / Supervisor', 'Inventory Manager', 'Administrator']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="staff"
                element={
                  <ProtectedRoute allowedRoles={['Head Nurse / Supervisor', 'Administrator']}>
                    <StaffPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['Administrator']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Error Handlers */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
