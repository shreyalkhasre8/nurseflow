import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { RegisterTemplate, RegisterEntry, Ward } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  History,
  FileEdit,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  User,
  ShieldCheck,
} from 'lucide-react';

export const RegistersPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [templates, setTemplates] = useState<RegisterTemplate[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('daily_nursing_activity');
  const [entries, setEntries] = useState<RegisterEntry[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals & Drawers
  const [selectedEntry, setSelectedEntry] = useState<RegisterEntry | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Form states
  const [newEntryData, setNewEntryData] = useState<Record<string, any>>({});
  const [newEntryWard, setNewEntryWard] = useState<string>(user?.wardId || '');
  const [newEntryDate, setNewEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Correction state
  const [correctionData, setCorrectionData] = useState<Record<string, any>>({});
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const activeTemplate = templates.find((t) => t.code === selectedTemplateCode);

  const loadTemplatesAndWards = async () => {
    try {
      const [tpls, wardsData] = await Promise.all([
        api.getRegisterTemplates(),
        api.getWards(),
      ]);
      setTemplates(tpls);
      setWards(wardsData);
      if (tpls.length > 0 && !selectedTemplateCode) {
        setSelectedTemplateCode(tpls[0].code);
      }
    } catch (err: any) {
      error('Failed to load register configuration');
    }
  };

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRegisterEntries({
        code: selectedTemplateCode,
        wardId: wardFilter,
        date: dateFilter,
        search,
      });
      setEntries(data);
    } catch (err: any) {
      error('Failed to load register records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplatesAndWards();
  }, []);

  useEffect(() => {
    if (selectedTemplateCode) {
      loadEntries();
    }
  }, [selectedTemplateCode, wardFilter, dateFilter, search]);

  const openEntryDetail = async (entry: RegisterEntry) => {
    try {
      const full = await api.getRegisterEntryById(entry.id);
      setSelectedEntry(full);
      setIsDetailDrawerOpen(true);
    } catch (err) {
      error('Failed to load entry details');
    }
  };

  const handleOpenCreate = () => {
    setNewEntryData({});
    setNewEntryWard(user?.wardId || (wards[0]?.id || ''));
    setNewEntryDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate || !newEntryWard) return;

    try {
      await api.createRegisterEntry({
        registerCode: activeTemplate.code,
        wardId: newEntryWard,
        date: newEntryDate,
        data: newEntryData,
      });
      success(`${activeTemplate.name} entry recorded successfully.`);
      setIsCreateModalOpen(false);
      loadEntries();
    } catch (err: any) {
      error(err.message || 'Failed to record register entry');
    }
  };

  const handleOpenCorrection = (entry: RegisterEntry) => {
    setSelectedEntry(entry);
    setCorrectionData({ ...entry.data });
    setCorrectionReason('');
    setIsCorrectionModalOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !correctionReason.trim()) {
      warning('Clinical reason for correction is strictly required.');
      return;
    }

    try {
      await api.updateRegisterCorrection(selectedEntry.id, correctionData, correctionReason);
      success('Correction recorded. Original entry preserved in audit trail.');
      setIsCorrectionModalOpen(false);
      setIsDetailDrawerOpen(false);
      loadEntries();
    } catch (err: any) {
      error(err.message || 'Failed to record correction');
    }
  };

  const exportCSV = () => {
    if (entries.length === 0 || !activeTemplate) return;

    const fields = activeTemplate.fieldsSchema || [];
    const headers = ['Entry ID', 'Date', 'Ward', 'Author', 'Version', 'Status', ...fields.map((f) => f.label)];
    
    const rows = entries.map((e) => {
      return [
        e.id.slice(0, 8),
        e.date,
        `"${e.ward_name || ''}"`,
        `"${e.author_name || ''}"`,
        `v${e.current_version}`,
        e.status,
        ...fields.map((f) => `"${String(e.data[f.key] || '').replace(/"/g, '""')}"`),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTemplate.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Register data exported to CSV');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Digital Nursing Registers"
        subtitle="Mandatory clinical registers with immutable versioning, audit logging, and NABH compliance"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Registers' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={exportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Record Entry
            </Button>
          </div>
        }
      />

      {/* 9 Digital Register Types Selector Bar */}
      <div className="bg-white p-2 rounded-clinical border border-slate-200 shadow-sm overflow-x-auto no-print">
        <div className="flex gap-1.5 min-w-max">
          {templates.map((tpl) => (
            <button
              key={tpl.code}
              onClick={() => setSelectedTemplateCode(tpl.code)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                selectedTemplateCode === tpl.code
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Register Information Banner */}
      {activeTemplate && (
        <div className="bg-slate-100/70 border border-slate-200 rounded-clinical p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">{activeTemplate.name}</h2>
            <p className="text-slate-500 mt-0.5">{activeTemplate.description}</p>
          </div>
          <div className="flex items-center gap-2 text-slate-500 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Audit Trail Active • Non-destructive Versioning</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm flex flex-wrap items-center gap-2.5 text-xs no-print">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search within this register (patient, UHID, diagnosis, notes)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-clinical border border-slate-300 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
        >
          <option value="ALL">All Clinical Wards</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
        />

        {(wardFilter !== 'ALL' || dateFilter || search) && (
          <button
            onClick={() => {
              setWardFilter('ALL');
              setDateFilter('');
              setSearch('');
            }}
            className="text-xs text-teal-700 hover:underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Registers Data Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Entry Date</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Primary Details / Patient</th>
                  <th className="py-2.5 px-4">Intervention Summary</th>
                  <th className="py-2.5 px-3">Author</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No records found for the selected register and filter criteria.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => openEntryDetail(entry)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {entry.date}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {entry.ward_name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {entry.data.patientName || entry.data.uhid || entry.data.itemName || entry.data.shiftName || 'Ward Entry'}
                        {entry.data.bedNo && (
                          <span className="block text-[10px] text-teal-700 font-normal">
                            {entry.data.bedNo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                        {entry.data.activityPerformed ||
                          entry.data.summaryNotes ||
                          entry.data.remarks ||
                          entry.data.descriptionOfEvent ||
                          entry.data.medicationName ||
                          'Registered clinical activity'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        Sister {entry.author_name}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          v{entry.current_version}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            entry.status === 'FINAL'
                              ? 'completed'
                              : entry.status === 'AMENDED'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap no-print"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEntryDetail(entry)}
                            className="px-2 py-1 text-xs text-teal-700 hover:bg-teal-50 rounded"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOpenCorrection(entry)}
                            className="px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 rounded flex items-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" /> Correct
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Entry Details Drawer with Version History */}
      {selectedEntry && (
        <Drawer
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title={selectedEntry.register_name || 'Clinical Register Entry'}
          subtitle={`Recorded on ${selectedEntry.date} in ${selectedEntry.ward_name}`}
          width="xl"
        >
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block">Author & Certification</span>
                <span className="font-bold text-slate-900">
                  Sister {selectedEntry.author_name} ({selectedEntry.author_emp_id})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedEntry.status === 'FINAL' ? 'completed' : 'warning'}>
                  {selectedEntry.status}
                </Badge>
                <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
                  Version {selectedEntry.current_version}
                </span>
              </div>
            </div>

            {/* Current Values Display */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-clinical border border-slate-200">
              <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5 text-xs">
                Current Certified Entry Data:
              </h4>
              {activeTemplate?.fieldsSchema.map((field) => (
                <div key={field.key} className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium text-[11px]">{field.label}:</span>
                  <span className="col-span-2 font-semibold text-slate-800 break-words">
                    {String(selectedEntry.data[field.key] || '—')}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                icon={<FileEdit className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => handleOpenCorrection(selectedEntry)}
              >
                Submit Clinical Correction (Creates Version {selectedEntry.current_version + 1})
              </Button>
            </div>

            {/* Non-destructive Correction Version History */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-700" />
                Immutable Version History & Correction Log
              </h3>

              {selectedEntry.history && selectedEntry.history.length > 0 ? (
                <div className="space-y-3">
                  {selectedEntry.history.map((hist) => (
                    <div key={hist.id} className="p-3 bg-amber-50/40 border border-amber-200 rounded-clinical text-xs">
                      <div className="flex items-center justify-between font-semibold text-amber-900 mb-1">
                        <span>Version {hist.version} (Archived Snapshot)</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(hist.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded border border-amber-100 mb-2">
                        <strong className="text-slate-700 block text-[11px] mb-0.5">Mandatory Correction Reason:</strong>
                        <p className="text-slate-800 italic">&ldquo;{hist.reason}&rdquo;</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Edited by Sister {hist.edited_by_name} ({hist.edited_by_emp_id})
                        </span>
                      </div>
                      <details className="text-[11px] text-slate-600">
                        <summary className="cursor-pointer text-teal-700 font-medium hover:underline">
                          Inspect snapshot data values
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-100 rounded overflow-x-auto text-[10px]">
                          {JSON.stringify(hist.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">
                  This is the original clinical entry (v1). No amendments or corrections have been recorded.
                </p>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* Create Register Entry Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`New Entry: ${activeTemplate?.name || 'Register'}`}
        subtitle="Ensure all mandatory fields are verified prior to signing"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward Location *</label>
              <select
                required
                value={newEntryWard}
                onChange={(e) => setNewEntryWard(e.target.value)}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Entry *</label>
              <input
                type="date"
                required
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Form Fields from Active Register Schema */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {activeTemplate?.fieldsSchema.map((field) => (
              <div key={field.key}>
                <label className="block font-semibold text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    rows={3}
                    value={newEntryData[field.key] || ''}
                    onChange={(e) =>
                      setNewEntryData({ ...newEntryData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    required={field.required}
                    value={newEntryData[field.key] || ''}
                    onChange={(e) =>
                      setNewEntryData({ ...newEntryData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="">Select option</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    required={field.required}
                    value={newEntryData[field.key] || ''}
                    onChange={(e) =>
                      setNewEntryData({ ...newEntryData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Sign & Record Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Register Correction Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Record Clinical Register Correction"
        subtitle="In accordance with NABH / JCI hospital standards, previous versions are permanently preserved in audit log"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 leading-relaxed">
            <strong>Correction Policy:</strong> You are amending Version {selectedEntry?.current_version}. The original entry will NOT be destroyed; it will be archived as a verified snapshot.
          </div>

          <div>
            <label className="block font-semibold text-red-700 mb-1">
              Mandatory Clinical Reason for Correction *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Transcription error in dosage, updated vitals post-resuscitation, correction of bed number..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-red-300 focus:ring-1 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800">Corrected Field Values:</h4>
            {activeTemplate?.fieldsSchema.map((field) => (
              <div key={field.key}>
                <label className="block font-medium text-slate-700 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    value={correctionData[field.key] || ''}
                    onChange={(e) =>
                      setCorrectionData({ ...correctionData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={correctionData[field.key] || ''}
                    onChange={(e) =>
                      setCorrectionData({ ...correctionData, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Sign & Save Version {((selectedEntry?.current_version || 1) + 1)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
