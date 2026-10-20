import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Users,
  CheckSquare,
  AlertCircle,
  Package,
  ArrowRightLeft,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  BarChart,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [workload, setWorkload] = useState<any[]>([]);
  const [summaryReport, setSummaryReport] = useState<any>(null);
  const [activeNurses, setActiveNurses] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [stockRequests, setStockRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSupervisorData() {
      setIsLoading(true);
      try {
        const [workloadData, summaryData, rosterData, handoversData, requestsData] =
          await Promise.all([
            api.getWorkloadReport(),
            api.getTaskSummaryReport(),
            api.getShiftAssignments({ date: new Date().toISOString().split('T')[0] }),
            api.getHandovers(),
            api.getStockRequests({ status: 'Pending' }),
          ]);

        setWorkload(workloadData);
        setSummaryReport(summaryData);
        setActiveNurses(rosterData);
        setHandovers(handoversData.filter((h) => h.status !== 'ACKNOWLEDGED'));
        setStockRequests(requestsData);
      } catch (err) {
        console.error('Failed to load supervisor dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSupervisorData();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton rows={10} />;
  }

  const pendingTasksTotal = summaryReport?.summary?.pending || 0;
  const overdueTasksTotal = summaryReport?.summary?.overdue || 0;
  const completionRate = summaryReport?.summary?.completionRate || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Supervisor Shift Overview Header */}
      <div className="bg-white rounded-clinical border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Clinical Supervisor Console — Sister {user?.name}
            </h1>
            <Badge variant="urgent">Charge Nurse</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Monitoring active clinical staffing, task completion rates, incomplete handovers, and requisition escalations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/shifts">
            <Button variant="outline" size="sm" icon={<CalendarDays className="w-3.5 h-3.5" />}>
              Manage Shift Roster
            </Button>
          </Link>
          <Link to="/tasks">
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Assign Clinical Task
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Nurses on Duty</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeNurses.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all inpatient wards</p>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className={`text-2xl font-bold ${overdueTasksTotal > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueTasksTotal}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Delayed beyond clinical window</p>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Handovers</span>
            <ArrowRightLeft className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{handovers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting incoming nurse signoff</p>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Stock Indents</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{stockRequests.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Requisitions awaiting approval</p>
        </div>
      </div>

      {/* Useful Clinical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Task Completion vs Overdue Chart */}
        <div className="bg-white rounded-clinical border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Task Completion & Delay Trends</h3>
              <p className="text-xs text-slate-500">Daily performance metrics over recent shifts</p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
              {completionRate}% Shift Compliance
            </span>
          </div>

          <div className="space-y-3">
            {summaryReport?.dailyBreakdown?.map((day: any) => (
              <div key={day.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700">{day.date}</span>
                  <span className="text-slate-500 text-[11px]">
                    {day.completed} Completed • {day.overdue} Overdue (Total: {day.total})
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`,
                    }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Completed: ${day.completed}`}
                  />
                  <div
                    style={{
                      width: `${day.total > 0 ? (day.overdue / day.total) * 100 : 0}%`,
                    }}
                    className="bg-red-500 transition-all duration-300"
                    title={`Overdue: ${day.overdue}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Completed on time
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500" /> Overdue / Delayed
            </span>
          </div>
        </div>

        {/* Task Breakdown by Clinical Category */}
        <div className="bg-white rounded-clinical border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Task Volume by Category</h3>
              <p className="text-xs text-slate-500">Distribution of nursing workload by intervention type</p>
            </div>
            <Link to="/tasks" className="text-xs text-teal-700 hover:underline">
              Inspect Tasks
            </Link>
          </div>

          <div className="space-y-2.5">
            {summaryReport?.categoryBreakdown?.map((cat: any) => {
              const maxCount = Math.max(...summaryReport.categoryBreakdown.map((c: any) => c.count), 1);
              const percentage = Math.round((cat.count / maxCount) * 100);

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{cat.category}</span>
                    <span className="font-semibold text-slate-700">{cat.count} tasks</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-teal-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Nurse Workload Monitoring Table */}
      <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-slate-900">Nurse Workload Distribution</h2>
          </div>
          <span className="text-xs text-slate-500">Active Nursing Census</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Nurse Name</th>
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Assigned Ward</th>
                <th className="py-2.5 px-3 text-center">Active Tasks</th>
                <th className="py-2.5 px-3 text-center">Completed</th>
                <th className="py-2.5 px-3 text-center">Overdue</th>
                <th className="py-2.5 px-4 text-right">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workload.map((nw) => {
                const totalActive = (nw.in_progress_tasks || 0) + (nw.pending_tasks || 0);
                const isHeavy = totalActive > 4;

                return (
                  <tr key={nw.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{nw.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{nw.employee_id}</td>
                    <td className="py-3 px-3 text-slate-700">{nw.ward_name || 'Float'}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{totalActive}</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                      {nw.completed_tasks || 0}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-semibold ${
                          nw.overdue_tasks > 0 ? 'text-red-600' : 'text-slate-400'
                        }`}
                      >
                        {nw.overdue_tasks || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={isHeavy ? 'warning' : 'completed'} dot>
                        {isHeavy ? 'High Load' : 'Balanced'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
