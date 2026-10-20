import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Ward } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRightLeft,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeReport, setActiveReport] = useState<'tasks' | 'workload' | 'consumption' | 'handover'>('tasks');
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardFilter, setWardFilter] = useState('ALL');
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [workloadReport, setWorkloadReport] = useState<any[]>([]);
  const [consumptionReport, setConsumptionReport] = useState<any[]>([]);
  const [handoverReport, setHandoverReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const wardsData = await api.getWards();
      setWards(wardsData);

      if (activeReport === 'tasks') {
        const data = await api.getTaskSummaryReport({ wardId: wardFilter });
        setTaskSummary(data);
      } else if (activeReport === 'workload') {
        const data = await api.getWorkloadReport({ wardId: wardFilter });
        setWorkloadReport(data);
      } else if (activeReport === 'consumption') {
        const data = await api.getInventoryConsumptionReport({ wardId: wardFilter });
        setConsumptionReport(data);
      } else if (activeReport === 'handover') {
        const data = await api.getHandoverComplianceReport();
        setHandoverReport(data);
      }
    } catch (err: any) {
      error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeReport, wardFilter]);

  const exportCurrentReportCSV = () => {
    let headers: string[] = [];
    let rows: string[] = [];
    let filename = `NurseFlow_${activeReport}_report.csv`;

    if (activeReport === 'workload') {
      headers = ['Staff Name', 'Employee ID', 'Ward', 'Total Tasks', 'Completed', 'In Progress', 'Pending', 'Overdue'];
      rows = workloadReport.map((w) =>
        [
          `"${w.name}"`,
          w.employee_id,
          `"${w.ward_name || ''}"`,
          w.total_tasks,
          w.completed_tasks,
          w.in_progress_tasks,
          w.pending_tasks,
          w.overdue_tasks,
        ].join(',')
      );
    } else if (activeReport === 'consumption') {
      headers = ['Item Code', 'Item Name', 'Category', 'Unit', 'Issued Qty', 'Received Qty', 'Returned Qty', 'Adjusted Qty', 'Store Balance'];
      rows = consumptionReport.map((c) =>
        [
          c.code,
          `"${c.name}"`,
          c.category,
          c.unit,
          c.issued_qty,
          c.received_qty,
          c.returned_qty,
          c.adjusted_qty,
          c.current_stock,
        ].join(',')
      );
    } else if (activeReport === 'handover') {
      headers = ['Ward Name', 'Total Handovers', 'Acknowledged', 'Pending Acknowledgment', 'Incomplete Flags'];
      rows = handoverReport.map((h) =>
        [
          `"${h.ward_name}"`,
          h.total_handovers,
          h.acknowledged_handovers,
          h.pending_handovers,
          h.incomplete_handovers,
        ].join(',')
      );
    } else {
      headers = ['Category', 'Task Volume'];
      rows = (taskSummary?.categoryBreakdown || []).map((c: any) => [`"${c.category}"`, c.count].join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report exported to CSV');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Clinical Operations Reports & Analytics"
        subtitle="Auditable summaries of nursing performance, consumption, shift workloads and compliance"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
        actions={
          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={exportCurrentReportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Report (PDF)
            </Button>
          </div>
        }
      />

      {/* Report Selector Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveReport('tasks')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeReport === 'tasks'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Task Performance & Delays
        </button>

        <button
          onClick={() => setActiveReport('workload')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeReport === 'workload'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Shift-wise Nurse Workload
        </button>

        <button
          onClick={() => setActiveReport('consumption')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeReport === 'consumption'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Ward Stock Consumption
        </button>

        <button
          onClick={() => setActiveReport('handover')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeReport === 'handover'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Handover Compliance
        </button>
      </div>

      {/* Ward Filter Toolbar */}
      <div className="bg-white p-3 rounded-clinical border border-slate-200 shadow-sm flex items-center justify-between text-xs no-print">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-teal-700" />
          <span className="font-semibold text-slate-800">Filter by Inpatient Ward:</span>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
          >
            <option value="ALL">All Hospital Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          Generated on {new Date().toLocaleDateString()}
        </span>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div>
          {/* 1. Task Performance & Delay Summary */}
          {activeReport === 'tasks' && taskSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Tasks</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{taskSummary.summary.total}</p>
                </div>
                <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase">Completed</span>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{taskSummary.summary.completed}</p>
                </div>
                <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-sky-700 uppercase">Pending</span>
                  <p className="text-2xl font-bold text-sky-700 mt-1">{taskSummary.summary.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-red-600 uppercase">Overdue / Delayed</span>
                  <p className="text-2xl font-bold text-red-600 mt-1">{taskSummary.summary.overdue}</p>
                </div>
                <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-teal-700 uppercase">Compliance Rate</span>
                  <p className="text-2xl font-bold text-teal-800 mt-1">{taskSummary.summary.completionRate}%</p>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 font-semibold text-xs text-slate-800 bg-slate-50">
                  Task Volume by Clinical Category
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Clinical Category</th>
                      <th className="py-2.5 px-4 text-right">Task Volume</th>
                      <th className="py-2.5 px-4 text-right">Share of Workload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {taskSummary.categoryBreakdown.map((cat: any) => {
                      const share = taskSummary.summary.total > 0
                        ? Math.round((cat.count / taskSummary.summary.total) * 100)
                        : 0;
                      return (
                        <tr key={cat.category} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{cat.category}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{cat.count}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Workload Report */}
          {activeReport === 'workload' && (
            <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Staff Nurse</th>
                    <th className="py-2.5 px-3">Employee ID</th>
                    <th className="py-2.5 px-3">Assigned Ward</th>
                    <th className="py-2.5 px-3 text-center">Total Assigned</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-center">In Progress</th>
                    <th className="py-2.5 px-3 text-center">Pending</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workloadReport.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">Sister {w.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{w.employee_id}</td>
                      <td className="py-3 px-3 text-slate-700">{w.ward_name || 'Float'}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">{w.total_tasks}</td>
                      <td className="py-3 px-3 text-center font-semibold text-emerald-700">{w.completed_tasks}</td>
                      <td className="py-3 px-3 text-center text-teal-700 font-semibold">{w.in_progress_tasks}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{w.pending_tasks}</td>
                      <td className="py-3 px-3 text-center font-bold text-red-600">{w.overdue_tasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Ward Stock Consumption Report */}
          {activeReport === 'consumption' && (
            <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Item Code</th>
                    <th className="py-2.5 px-3">Medication / Supply</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Issued to Wards</th>
                    <th className="py-2.5 px-3 text-center">Store Receipts</th>
                    <th className="py-2.5 px-3 text-center">Ward Returns</th>
                    <th className="py-2.5 px-3 text-center">Adjusted Qty</th>
                    <th className="py-2.5 px-4 text-right">Current Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consumptionReport.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-teal-800">{c.code}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{c.name}</td>
                      <td className="py-3 px-3 text-slate-600">{c.category}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{c.issued_qty} {c.unit}</td>
                      <td className="py-3 px-3 text-center text-emerald-700">{c.received_qty} {c.unit}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{c.returned_qty} {c.unit}</td>
                      <td className="py-3 px-3 text-center text-amber-700">{c.adjusted_qty} {c.unit}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-900">{c.current_stock} {c.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Handover Compliance Report */}
          {activeReport === 'handover' && (
            <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Inpatient Ward</th>
                    <th className="py-2.5 px-4 text-center">Total Handovers Logged</th>
                    <th className="py-2.5 px-4 text-center">Digitally Acknowledged</th>
                    <th className="py-2.5 px-4 text-center">Pending Signoff</th>
                    <th className="py-2.5 px-4 text-center">Incomplete Flags</th>
                    <th className="py-2.5 px-4 text-right">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {handoverReport.map((h) => {
                    const rate = h.total_handovers > 0
                      ? Math.round((h.acknowledged_handovers / h.total_handovers) * 100)
                      : 100;

                    return (
                      <tr key={h.ward_name} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{h.ward_name}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{h.total_handovers}</td>
                        <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                          {h.acknowledged_handovers}
                        </td>
                        <td className="py-3 px-4 text-center text-amber-700">{h.pending_handovers}</td>
                        <td className="py-3 px-4 text-center text-red-600 font-bold">{h.incomplete_handovers}</td>
                        <td className="py-3 px-4 text-right font-bold text-teal-800">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
