import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NurseDashboard } from './NurseDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { InventoryManagerDashboard } from './InventoryManagerDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardPage: React.FC = () => {
  const { isNurse, isSupervisor, isInventoryManager, isAdmin } = useAuth();

  if (isNurse) {
    return <NurseDashboard />;
  }

  if (isSupervisor) {
    return <SupervisorDashboard />;
  }

  if (isInventoryManager) {
    return <InventoryManagerDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <NurseDashboard />;
};
