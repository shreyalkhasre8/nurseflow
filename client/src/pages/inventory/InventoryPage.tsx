import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { InventoryItem, StockRequest, Ward } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  Clock,
  AlertTriangle,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  Boxes,
  Truck,
  Send,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { user, isNurse, isSupervisor, isInventoryManager, isAdmin } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'catalog' | 'requests' | 'transactions'>('catalog');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  const [isReviewRequestModalOpen, setIsReviewRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);

  // CSV Import & Export States
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvValidation, setCsvValidation] = useState<{
    totalRows: number;
    validCount: number;
    errorCount: number;
    errors: any[];
    preview: any[];
  } | null>(null);
  const [isValidatingCsv, setIsValidatingCsv] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Form states for stock transactions
  const [receiveForm, setReceiveForm] = useState({
    itemId: '',
    batchNumber: '',
    quantity: 100,
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    source: 'MedPlus Healthcare Wholesale Ltd',
    notes: 'Routine consignment intake',
  });

  const [issueForm, setIssueForm] = useState({
    itemId: '',
    batchId: '',
    quantity: 10,
    wardId: user?.wardId || '',
    reason: 'Daily ward replenishment',
  });

  const [adjustForm, setAdjustForm] = useState({
    itemId: '',
    batchId: '',
    newQuantity: 0,
    reason: 'Monthly physical stock count reconciliation',
  });

  // Requisition Form state
  const [reqForm, setReqForm] = useState({
    wardId: user?.wardId || '',
    urgency: 'Normal',
    notes: '',
    items: [{ itemId: '', quantityRequested: 10, notes: '' }],
  });

  // Review Form state
  const [reviewComment, setReviewComment] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, itemsData, wardsData] = await Promise.all([
        api.getInventoryMetrics(),
        api.getInventoryItems({
          category: categoryFilter,
          status: statusFilter,
          search,
        }),
        api.getWards(),
      ]);

      setMetrics(metricsData);
      setItems(itemsData);
      setWards(wardsData);

      if (activeTab === 'requests') {
        const reqs = await api.getStockRequests();
        setRequests(reqs);
      } else if (activeTab === 'transactions') {
        const txns = await api.getInventoryTransactions();
        setTransactions(txns);
      }
    } catch (err: any) {
      error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, categoryFilter, statusFilter, search]);

  const openItemDetail = async (item: InventoryItem) => {
    try {
      const full = await api.getItemById(item.id);
      setSelectedItem(full);
      setIsItemDrawerOpen(true);
    } catch (err) {
      error('Failed to load item details');
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.receiveStock(receiveForm);
      success('Stock received into inventory successfully.');
      setIsReceiveModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to receive stock');
    }
  };

  const handleIssueStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.issueStock(issueForm);
      success('Stock issued to ward successfully.');
      setIsIssueModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to issue stock');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adjustStock(adjustForm);
      success('Stock reconciliation recorded.');
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to adjust stock');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createStockRequest(reqForm);
      success(`Requisition ${res.requestNo} submitted for supervisor review.`);
      setIsCreateRequestModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create request');
    }
  };

  const handleReviewRequest = async (status: string) => {
    if (!selectedRequest) return;
    try {
      await api.reviewStockRequest(selectedRequest.id, status, reviewComment);
      success(`Requisition marked as ${status}`);
      setIsReviewRequestModalOpen(false);
      setReviewComment('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to review request');
    }
  };

  const handleDownloadCsvTemplate = async () => {
    try {
      const token = localStorage.getItem('nurseflow_token');
      const res = await fetch('/api/inventory/template/csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nurseflow_inventory_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success('CSV template downloaded.');
    } catch (err) {
      error('Failed to download template');
    }
  };

  const handleExportInventoryCsv = async () => {
    try {
      const token = localStorage.getItem('nurseflow_token');
      const res = await fetch('/api/inventory/export/csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nurseflow_inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success('Inventory catalog exported to CSV successfully.');
    } catch (err) {
      error('Failed to export inventory CSV');
    }
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvValidation(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        warning('CSV file appears empty or missing data rows');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx] !== undefined ? cols[idx] : '';
        });
        parsedRows.push(obj);
      }

      setIsValidatingCsv(true);
      try {
        const res = await api.validateInventoryCsv(parsedRows);
        setCsvValidation(res);
        if (res.errorCount === 0) {
          success(`Validated ${res.validCount} rows successfully.`);
        } else {
          warning(`Found ${res.errorCount} validation issues in CSV.`);
        }
      } catch (err: any) {
        error(err.message || 'Validation failed');
      } finally {
        setIsValidatingCsv(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    if (!csvValidation || csvValidation.preview.length === 0) return;
    setIsImportingCsv(true);
    try {
      const res = await api.confirmInventoryCsv(csvValidation.preview);
      success(res.message);
      setIsCsvModalOpen(false);
      setCsvFile(null);
      setCsvValidation(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Import failed');
    } finally {
      setIsImportingCsv(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Ward & Central Pharmacy Inventory"
        subtitle="Batch management, cold chain tracking, stock requisitions, and dispensation ledgers"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Inventory' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportInventoryCsv}
            >
              Export CSV
            </Button>

            {(isInventoryManager || isAdmin) && (
              <Button
                variant="outline"
                size="sm"
                icon={<Upload className="w-3.5 h-3.5 text-slate-700" />}
                onClick={() => {
                  setCsvFile(null);
                  setCsvValidation(null);
                  setIsCsvModalOpen(true);
                }}
              >
                Import CSV
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={() => {
                setReqForm({
                  wardId: user?.wardId || (wards[0]?.id || ''),
                  urgency: 'Normal',
                  notes: '',
                  items: [{ itemId: items[0]?.id || '', quantityRequested: 20, notes: '' }],
                });
                setIsCreateRequestModalOpen(true);
              }}
            >
              Request Stock Indent
            </Button>

            {(isInventoryManager || isAdmin) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowDownLeft className="w-3.5 h-3.5 text-teal-700" />}
                  onClick={() => {
                    setReceiveForm({ ...receiveForm, itemId: items[0]?.id || '' });
                    setIsReceiveModalOpen(true);
                  }}
                >
                  Receive Consignment
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setIssueForm({ ...issueForm, itemId: items[0]?.id || '', wardId: user?.wardId || wards[0]?.id || '' });
                    setIsIssueModalOpen(true);
                  }}
                >
                  Issue to Ward
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Items</span>
            <Boxes className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{metrics?.totalItems || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Catalogued SKUs</p>
        </div>

        <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700">{metrics?.lowStockCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Below safety buffer</p>
        </div>

        <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Near Expiry</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold text-sky-700">{metrics?.nearExpiryCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Expiring in &lt; 60 days</p>
        </div>

        <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Expired</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600">{metrics?.expiredCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Quarantine required</p>
        </div>

        <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Indents</span>
            <Send className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-700">{metrics?.pendingRequestsCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending approval</p>
        </div>
      </div>

      {/* Main Tabs: Catalog vs Stock Requests vs Movement Ledger */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Stock Catalog & Batches
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          Ward Stock Requisitions
          {metrics?.pendingRequestsCount > 0 && (
            <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {metrics.pendingRequestsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Stock Movement Ledger
        </button>
      </div>

      {/* Catalog View */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search medication name, SKU code or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-clinical border border-slate-300 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="Pharmaceuticals">Pharmaceuticals</option>
              <option value="Consumables">Consumables</option>
              <option value="Surgical">Surgical</option>
              <option value="PPE">PPE</option>
              <option value="Equipment">Equipment</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW_STOCK">Below Safe Minimum</option>
              <option value="NEAR_EXPIRY">Expiring &lt; 60 Days</option>
              <option value="EXPIRED">Expired Batches</option>
            </select>
          </div>

          {/* Catalog Table */}
          {isLoading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-4">Item Code</th>
                      <th className="py-2.5 px-3">Item Specification</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3 text-center">Current Total Stock</th>
                      <th className="py-2.5 px-3 text-center">Safety Min</th>
                      <th className="py-2.5 px-3">Earliest Expiry</th>
                      <th className="py-2.5 px-3">Stock Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const isLow = item.current_stock <= item.min_stock;
                      const isNearExp =
                        item.earliest_expiry &&
                        new Date(item.earliest_expiry).getTime() - Date.now() <
                          60 * 24 * 3600 * 1000;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => openItemDetail(item)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-semibold text-teal-800">
                            {item.code}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900 max-w-xs">
                            <span className="block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Vendor: {item.supplier_name || 'Central Pharmacy'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {item.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                            {item.current_stock}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 whitespace-nowrap">
                            {item.min_stock}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                            {item.earliest_expiry ? (
                              <span className={isNearExp ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                                {item.earliest_expiry}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isLow ? (
                              <Badge variant="warning" dot>Low Stock</Badge>
                            ) : (
                              <Badge variant="completed" dot>Adequate</Badge>
                            )}
                          </td>
                          <td
                            className="py-3 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openItemDetail(item)}
                                className="px-2 py-1 text-xs text-teal-700 hover:bg-teal-50 rounded"
                              >
                                Batches
                              </button>
                              {(isInventoryManager || isAdmin) && (
                                <button
                                  onClick={() => {
                                    setAdjustForm({
                                      itemId: item.id,
                                      batchId: item.batches?.[0]?.id || '',
                                      newQuantity: item.current_stock,
                                      reason: 'Count adjustment',
                                    });
                                    setIsAdjustModalOpen(true);
                                  }}
                                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 rounded"
                                >
                                  Adjust
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Requisitions View */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Request No.</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Requested By</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3 text-center">Items Count</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No stock requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">
                        {req.request_no}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{req.ward_name}</td>
                      <td className="py-3 px-3 text-slate-600">Sister {req.requested_by_name}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            req.urgency === 'Emergency'
                              ? 'urgent'
                              : req.urgency === 'Urgent'
                              ? 'high'
                              : 'neutral'
                          }
                          dot
                        >
                          {req.urgency}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {req.item_count} items ({req.total_units_requested} units)
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(req.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            req.status === 'Approved'
                              ? 'completed'
                              : req.status === 'Pending'
                              ? 'warning'
                              : req.status === 'Rejected'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(isSupervisor || isInventoryManager || isAdmin) &&
                        req.status === 'Pending' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsReviewRequestModalOpen(true);
                            }}
                          >
                            Review & Approve
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {req.reviewed_by_name ? `Reviewed by ${req.reviewed_by_name}` : 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Ledger View */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-3">Movement Type</th>
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">Batch No.</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3">Source / Destination</th>
                  <th className="py-2.5 px-3">Reason / Requisition</th>
                  <th className="py-2.5 px-4 text-right">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge
                        variant={
                          t.type === 'RECEIVED'
                            ? 'completed'
                            : t.type === 'ISSUED'
                            ? 'medium'
                            : t.type === 'ADJUSTED'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {t.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {t.item_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {t.item_code}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {t.batch_number || '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {t.quantity} {t.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {t.source || 'Central Store'} → {t.destination || t.ward_name || 'Ward'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{t.reason || 'Routine'}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-medium">
                      {t.staff_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Details Drawer */}
      {selectedItem && (
        <Drawer
          isOpen={isItemDrawerOpen}
          onClose={() => setIsItemDrawerOpen(false)}
          title={selectedItem.name}
          subtitle={`Code: ${selectedItem.code} • Category: ${selectedItem.category}`}
          width="xl"
        >
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-clinical border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Total Active Stock</span>
                <span className="text-base font-bold text-teal-800">
                  {selectedItem.current_stock} {selectedItem.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Safety Buffer Min</span>
                <span className="text-base font-bold text-slate-800">
                  {selectedItem.min_stock} {selectedItem.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Unit Price</span>
                <span className="text-base font-bold text-slate-800">
                  ₹{selectedItem.cost_per_unit?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Batches Table */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Active Consignment Batches ({selectedItem.batches?.length || 0})
              </h3>
              <div className="border border-slate-200 rounded-clinical overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Batch Number</th>
                      <th className="py-2 px-2">Expiry Date</th>
                      <th className="py-2 px-2 text-center">Remaining</th>
                      <th className="py-2 px-3">Location Bin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedItem.batches?.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{b.batch_number}</td>
                        <td className="py-2 px-2 font-mono text-slate-700">{b.expiry_date}</td>
                        <td className="py-2 px-2 text-center font-bold text-teal-800">
                          {b.quantity} / {b.initial_quantity}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{b.location_bin || 'Store'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Stock Indent Creation Modal */}
      <Modal
        isOpen={isCreateRequestModalOpen}
        onClose={() => setIsCreateRequestModalOpen(false)}
        title="Raise Ward Stock Requisition"
        subtitle="Submit consumable or medication indent to Central Pharmacy & Stores"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward Location *</label>
              <select
                required
                value={reqForm.wardId}
                onChange={(e) => setReqForm({ ...reqForm, wardId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Urgency</label>
              <select
                value={reqForm.urgency}
                onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-medium"
              >
                <option value="Normal">Routine Indent</option>
                <option value="Urgent">Urgent Ward Need</option>
                <option value="Emergency">🚨 EMERGENCY Life Saving</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Stock Item *</label>
            <select
              required
              value={reqForm.items[0]?.itemId}
              onChange={(e) => {
                const newItems = [...reqForm.items];
                newItems[0].itemId = e.target.value;
                setReqForm({ ...reqForm, items: newItems });
              }}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.code}) - {it.current_stock} {it.unit} in central store
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantity Requested *</label>
            <input
              type="number"
              required
              min={1}
              value={reqForm.items[0]?.quantityRequested}
              onChange={(e) => {
                const newItems = [...reqForm.items];
                newItems[0].quantityRequested = parseInt(e.target.value, 10) || 1;
                setReqForm({ ...reqForm, items: newItems });
              }}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Justification</label>
            <textarea
              rows={2}
              placeholder="e.g. ICU admissions spike, post-op wound dressings replenishment"
              value={reqForm.notes}
              onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Request Modal */}
      <Modal
        isOpen={isReviewRequestModalOpen}
        onClose={() => setIsReviewRequestModalOpen(false)}
        title={`Review Requisition: ${selectedRequest?.request_no}`}
        subtitle={`Submitted by Sister ${selectedRequest?.requested_by_name} for ${selectedRequest?.ward_name}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <p className="font-semibold text-slate-800">Requisition Note:</p>
            <p className="text-slate-600 mt-1 italic">{selectedRequest?.notes || 'Routine replenishment'}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supervisor / Store Remarks</label>
            <input
              type="text"
              placeholder="e.g. Approved in full, dispatched to ward store"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="danger" size="sm" onClick={() => handleReviewRequest('Rejected')}>
              Reject Indent
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleReviewRequest('Approved')}>
              Approve Requisition
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receive Stock Consignment Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Consignment into Central Stores"
        subtitle="Record incoming batches, batch numbers and expiration dates"
        maxWidth="lg"
      >
        <form onSubmit={handleReceiveStock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catalog Item *</label>
            <select
              required
              value={receiveForm.itemId}
              onChange={(e) => setReceiveForm({ ...receiveForm, itemId: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. NS26G04"
                value={receiveForm.batchNumber}
                onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity Received *</label>
              <input
                type="number"
                required
                min={1}
                value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expiration Date *</label>
              <input
                type="date"
                required
                value={receiveForm.expiryDate}
                onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Source</label>
              <input
                type="text"
                value={receiveForm.source}
                onChange={(e) => setReceiveForm({ ...receiveForm, source: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Verify & Record Consignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue Stock to Ward Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Stock Consignment to Ward"
        subtitle="Dispatches inventory from central pharmacy to clinical ward store"
        maxWidth="md"
      >
        <form onSubmit={handleIssueStock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Ward *</label>
            <select
              required
              value={issueForm.wardId}
              onChange={(e) => setIssueForm({ ...issueForm, wardId: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Item *</label>
            <select
              required
              value={issueForm.itemId}
              onChange={(e) => setIssueForm({ ...issueForm, itemId: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.current_stock} {it.unit} in store)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantity to Issue *</label>
            <input
              type="number"
              required
              min={1}
              value={issueForm.quantity}
              onChange={(e) => setIssueForm({ ...issueForm, quantity: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-bold"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Dispatch to Ward
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Reconciliation Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Physical Inventory Reconciliation"
        subtitle="Mandatory documentation of count discrepancy, damage or spoilage"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Physical Verified Count *</label>
            <input
              type="number"
              required
              min={0}
              value={adjustForm.newQuantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, newQuantity: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-bold text-base"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Reconciliation Reason *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Spoilage during transit, broken ampoule, physical audit variance"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Commit Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Batch Catalog Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Inventory Catalog via CSV"
        subtitle="Bulk ingest pharmaceutical and surgical items with automated validation"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-clinical">
            <div>
              <p className="font-semibold text-slate-800">Standardized CSV Template</p>
              <p className="text-slate-500 text-[11px]">Columns: code, name, category, unit, min_stock, cost_per_unit, description</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadCsvTemplate}
            >
              Download Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-clinical p-5 text-center hover:bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".csv"
              id="csv-file-input"
              className="hidden"
              onChange={handleCsvFileSelected}
            />
            <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet className="w-8 h-8 text-teal-600 mb-2" />
              <span className="font-semibold text-slate-800">
                {csvFile ? csvFile.name : 'Click to select CSV file from your computer'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">Supports UTF-8 CSV datasets</span>
            </label>
          </div>

          {isValidatingCsv && (
            <div className="p-3 text-center text-teal-700 bg-teal-50 border border-teal-200 rounded-clinical animate-pulse">
              Validating CSV rows against inventory schema...
            </div>
          )}

          {csvValidation && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-100 rounded-clinical text-center border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Rows</div>
                  <div className="text-base font-bold text-slate-800">{csvValidation.totalRows}</div>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-clinical text-center border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">Valid Rows</div>
                  <div className="text-base font-bold text-emerald-700">{csvValidation.validCount}</div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-clinical text-center border border-rose-200">
                  <div className="text-[10px] text-rose-700 uppercase font-semibold">Errors Found</div>
                  <div className="text-base font-bold text-rose-700">{csvValidation.errorCount}</div>
                </div>
              </div>

              {csvValidation.errorCount > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-clinical max-h-36 overflow-y-auto space-y-1">
                  <p className="font-bold text-rose-800 text-[11px]">Validation Issues Detected:</p>
                  {csvValidation.errors.map((err, i) => (
                    <div key={i} className="text-rose-700 text-[11px] flex items-start gap-1.5">
                      <span className="font-bold">Row {err.rowNumber} [{err.itemCode}]:</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {csvValidation.validCount > 0 && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Preview Valid Records ({csvValidation.preview.length} shown):</p>
                  <div className="border border-slate-200 rounded-clinical overflow-x-auto max-h-40">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Code</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Min Stock</th>
                          <th className="p-2">Cost (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvValidation.preview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-teal-800">{row.code}</td>
                            <td className="p-2 text-slate-800">{row.name}</td>
                            <td className="p-2 text-slate-600">{row.category}</td>
                            <td className="p-2 text-slate-600">{row.unit}</td>
                            <td className="p-2 text-slate-600">{row.minStock}</td>
                            <td className="p-2 text-slate-600">₹{row.costPerUnit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setIsCsvModalOpen(false);
                setCsvFile(null);
                setCsvValidation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!csvValidation || csvValidation.validCount === 0 || isImportingCsv}
              onClick={handleConfirmCsvImport}
            >
              {isImportingCsv ? 'Importing Dataset...' : `Confirm Import (${csvValidation?.validCount || 0} Items)`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
