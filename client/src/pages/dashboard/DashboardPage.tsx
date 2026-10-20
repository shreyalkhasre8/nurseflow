import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NurseDashboard } from './NurseDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { AdminPage } from '../admin/AdminPage';
import { InventoryPage } from '../inventory/InventoryPage';

export const DashboardPage: React.FC = () => {
  const { user, isNurse, isSupervisor, isInventoryManager, isAdmin } = useAuth();

  if (isNurse) {
    return <NurseDashboard />;
  }

  if (isSupervisor) {
    return <SupervisorDashboard />;
  }

  if (isInventoryManager) {
    return <InventoryPage />;
  }

  if (isAdmin) {
    return <SupervisorDashboard />;
  }

  return <NurseDashboard />;
};
