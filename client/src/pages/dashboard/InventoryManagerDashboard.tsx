import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { InventoryItem, StockRequest } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Package,
  AlertTriangle,
  Clock,
  Send,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Download,
  Building2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InventoryManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [nearExpiryBatches, setNearExpiryBatches] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StockRequest[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, lowData, alertsData, requestsData, txnsData] = await Promise.all([
        api.getInventoryMetrics(),
        api.getInventoryItems({ status: 'LOW_STOCK' }),
        api.getInventoryAlertsReport(),
        api.getStockRequests({ status: 'Pending' }),
        api.getInventoryTransactions({ limit: '8' }),
      ]);

      setMetrics(metricsData);
      setLowStockItems(lowData.slice(0, 6));
      setNearExpiryBatches(alertsData.nearExpiryBatches.slice(0, 6));
      setPendingRequests(requestsData.slice(0, 5));
      setRecentTransactions(txnsData.slice(0, 8));
    } catch (err: any) {
      error('Failed to load inventory management dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickApproveRequest = async (requestId: string) => {
    try {
      await api.reviewStockRequest(requestId, 'Approved', 'Approved via Inventory Operations Dashboard');
      success('Ward stock requisition approved successfully.');
      loadDashboardData();
    } catch (err: any) {
      error(err.message || 'Failed to approve request');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        <LoadingSkeleton type="card" count={4} />
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-clinical border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              Central Pharmacy Logistics
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-mono">{user?.employeeId}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time procurement, cold chain tracking, requisition approvals, and consumption ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={() => navigate('/inventory')}
          >
            Manage Catalog
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowDownLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate('/inventory')}
          >
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Catalog SKUs</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalItems || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active hospital consumables</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics?.lowStockCount || 0}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">Below safety threshold</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Near Expiry (&lt;60d)</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{metrics?.nearExpiryCount || 0}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">Prioritize rotation (FEFO)</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Expired Batches</span>
            <XCircle className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-2xl font-bold text-rose-800">{metrics?.expiredCount || 0}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">Quarantined from issue</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ward Indents</span>
            <Send className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{metrics?.pendingRequestsCount || 0}</div>
          <div className="text-[11px] text-teal-700 mt-1 font-medium">Awaiting approval</div>
        </div>
      </div>

      {/* Main Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Pending Requisitions & Critical Stock Alerts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Pending Ward Requisitions */}
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pending Ward Stock Requisitions</h2>
                <p className="text-[11px] text-slate-500">Urgent consumable orders submitted by inpatient wards</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/inventory')}
                className="text-xs text-teal-700"
              >
                View All Requests
              </Button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                All ward requisitions have been reviewed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{req.request_no}</span>
                        <Badge
                          variant={
                            req.urgency === 'Emergency' ? 'danger' : req.urgency === 'Urgent' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {req.urgency}
                        </Badge>
                        <span className="text-slate-600 font-medium">{req.ward_name}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Requested by {req.requested_by_name || 'Staff Nurse'} &bull; {req.items?.length || 0} items requested
                      </p>
                      {req.notes && <p className="text-slate-400 text-[11px] italic mt-0.5">&ldquo;{req.notes}&rdquo;</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleQuickApproveRequest(req.id)}
                      >
                        Approve Indent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Critical Low Stock SKUs Table */}
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Critical Stock Depletion Alerts</h2>
                <p className="text-[11px] text-slate-500">Items currently at or below hospital safety threshold</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/inventory')}
                className="text-xs text-teal-700"
              >
                Full Inventory Ledger
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Available</th>
                    <th className="py-2.5 px-3 text-right">Safety Min</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{item.category}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {item.min_stock} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="danger" size="sm">
                          Low Stock
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Batches Expiring Soon & Recent Movement Feed */}
        <div className="space-y-5">
          {/* Near Expiry Batches */}
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Batches Expiring Soon (&lt;60 Days)</h2>
            <p className="text-[11px] text-slate-500 mb-3">Enforce First-Expired-First-Out (FEFO) dispensing</p>

            <div className="space-y-2.5">
              {nearExpiryBatches.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-clinical bg-amber-50/60 border border-amber-200 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{b.item_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Batch {b.batch_number} &bull; {b.quantity} {b.unit} remaining
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="warning" size="sm">
                      {b.days_to_expiry} days left
                    </Badge>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.expiry_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Movement Ledger Feed */}
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Live Material Movements</h2>
            <p className="text-[11px] text-slate-500 mb-3">Forensic log of stock receipts, issues, and returns</p>

            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="text-xs flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className={`mt-0.5 p-1 rounded-full ${
                    txn.type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                    txn.type === 'ISSUED' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {txn.type === 'RECEIVED' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{txn.item_name}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {txn.type === 'ISSUED' ? '-' : '+'}{txn.quantity} {txn.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{txn.type}</span> &bull; <span>{txn.ward_name || txn.destination || 'Central Store'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By {txn.staff_name} &bull; {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
