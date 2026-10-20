import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Task, RegisterEntry, Handover, InventoryItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Building2,
  ArrowRight,
  BookOpen,
  Package,
  Plus,
  CheckSquare,
  Activity,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const NurseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentRegisters, setRecentRegisters] = useState<RegisterEntry[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [myTasks, registersData, handoversData, inventoryData] = await Promise.all([
          api.getMyTasks(),
          api.getRegisterEntries({ wardId: user?.wardId || undefined }),
          api.getHandovers({ wardId: user?.wardId || undefined }),
          api.getInventoryItems({ status: 'LOW_STOCK' }),
        ]);

        setTasks(myTasks);
        setRecentRegisters(registersData.slice(0, 5));
        setHandovers(handoversData.slice(0, 3));
        setLowStockItems(inventoryData.slice(0, 4));
      } catch (err) {
        console.error('Failed to load nurse dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Metrics calculations
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const overdueCount = tasks.filter(
    (t) =>
      t.status !== 'Completed' &&
      t.status !== 'Cancelled' &&
      new Date(t.due_date).getTime() < Date.now()
  ).length;

  if (isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clinical Shift Top Greeting & Context Banner */}
      <div className="bg-white rounded-clinical border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Good day, Sister {user?.name}
            </h1>
            <Badge variant="medium" dot>On Duty</Badge>
          </div>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              Ward: {user?.wardName || 'Medical ICU (MICU)'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Shift: 07:00 – 15:00 (Morning Shift)
            </span>
            <span>•</span>
            <span className="text-slate-500">
              Registration No: {user?.registrationNo || 'KNC-2018-98442'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/handover">
            <Button variant="outline" size="sm" icon={<ArrowRightLeft className="w-3.5 h-3.5 text-teal-700" />}>
              Shift Handover
            </Button>
          </Link>
          <Link to="/registers">
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Record Register Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned this shift</p>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-700">{inProgressCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently active</p>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{completedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Executed tasks</p>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {overdueCount > 0 ? 'Immediate action required' : 'All on schedule'}
          </p>
        </div>
      </div>

      {/* Main Task Section: "My Shift Tasks" Compact Table */}
      <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-slate-900">My Shift Tasks</h2>
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {tasks.length} total
            </span>
          </div>
          <Link
            to="/tasks"
            className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            View All Tasks <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Task Specification</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Patient / Bed Ref</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Due Deadline</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No clinical tasks assigned for your current shift.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const isOverdue =
                    t.status !== 'Completed' &&
                    t.status !== 'Cancelled' &&
                    new Date(t.due_date).getTime() < Date.now();

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isOverdue ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                        <div className="flex items-center gap-2">
                          {t.escalated === 1 && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                              ESCALATED
                            </span>
                          )}
                          <span className="truncate">{t.title}</span>
                        </div>
                        {t.instructions && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {t.instructions}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {t.category_name}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {t.patient_reference || 'General Ward'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            t.priority === 'Urgent'
                              ? 'urgent'
                              : t.priority === 'High'
                              ? 'high'
                              : t.priority === 'Medium'
                              ? 'medium'
                              : 'low'
                          }
                          dot
                        >
                          {t.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-xs ${
                            isOverdue ? 'text-red-700 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {new Date(t.due_date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-red-600 font-semibold uppercase">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            t.status === 'Completed'
                              ? 'completed'
                              : t.status === 'In Progress'
                              ? 'in_progress'
                              : t.status === 'Cancelled'
                              ? 'cancelled'
                              : 'pending'
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'In Progress')}
                              className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {t.status === 'In Progress' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'Completed')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            >
                              Done
                            </button>
                          )}
                          <Link
                            to={`/tasks`}
                            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 rounded transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Dashboard Sections: Registers, Handover, and Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Register Activity */}
        <div className="bg-white rounded-clinical border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Ward Registers
              </h3>
            </div>
            <Link to="/registers" className="text-xs text-teal-700 hover:underline">
              All Registers
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentRegisters.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No register entries logged today yet.</p>
            ) : (
              recentRegisters.map((reg) => (
                <div key={reg.id} className="p-2.5 rounded-md bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">{reg.register_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] truncate">
                    Patient: {reg.data?.patientName || reg.data?.uhid || reg.ward_name} • Logged by Sister {reg.author_name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Shift Handover Status */}
        <div className="bg-white rounded-clinical border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Shift Handover Status
              </h3>
            </div>
            <Link to="/handover" className="text-xs text-teal-700 hover:underline">
              Handover Hub
            </Link>
          </div>

          <div className="space-y-3">
            {handovers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active shift handover pending.</p>
            ) : (
              handovers.map((h) => (
                <div key={h.id} className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-800">{h.shift_name} Handover</span>
                    <Badge
                      variant={
                        h.status === 'ACKNOWLEDGED'
                          ? 'completed'
                          : h.status === 'INCOMPLETE'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {h.status === 'PENDING_ACKNOWLEDGEMENT' ? 'Awaiting Ack' : h.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2 leading-relaxed line-clamp-2">
                    {h.notes || 'No critical equipment issues. All patients stable.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                    <span>Outgoing: Sister {h.outgoing_nurse_name}</span>
                    <Link to={`/handover`} className="text-teal-700 font-semibold hover:underline">
                      Review & Ack →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ward Low Stock Warnings */}
        <div className="bg-white rounded-clinical border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Critical Stock Alerts
              </h3>
            </div>
            <Link to="/inventory" className="text-xs text-teal-700 hover:underline">
              Ward Stores
            </Link>
          </div>

          <div className="space-y-2">
            {lowStockItems.length === 0 ? (
              <div className="p-4 bg-emerald-50 rounded text-center text-xs text-emerald-800 border border-emerald-200">
                All essential ward medications & consumables are above safety thresholds.
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-md bg-amber-50/50 border border-amber-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Code: {item.code} • Min Safety: {item.min_stock} {item.unit}
                    </p>
                  </div>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                    {item.current_stock} {item.unit} left
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-center">
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Create Stock Indent / Requisition
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
