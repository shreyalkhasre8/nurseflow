import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Handover, Shift, Ward, User, Task } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  UserCheck,
  ShieldAlert,
  FileText,
  Search,
} from 'lucide-react';

export const HandoverPage: React.FC = () => {
  const { user, isNurse, isSupervisor, isAdmin } = useAuth();
  const { success, error, warning } = useToast();

  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [nurses, setNurses] = useState<User[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [ackNote, setAckNote] = useState('');

  // Create form
  const [createForm, setCreateForm] = useState({
    wardId: user?.wardId || '',
    shiftId: '',
    date: new Date().toISOString().split('T')[0],
    incomingNurseId: '',
    notes: '',
    equipmentIssues: 'All biomedical monitors and infusion pumps functional.',
    unresolvedIncidents: 'Nil clinical incidents reported.',
    pendingTaskIds: [] as string[],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [handoversData, shiftsData, wardsData, nursesData, tasksData] = await Promise.all([
        api.getHandovers(),
        api.getShiftTypes(),
        api.getWards(),
        api.getUsers({ roleId: 'role-nurse' }),
        api.getMyTasks({ status: 'Pending' }),
      ]);

      setHandovers(handoversData);
      setShifts(shiftsData);
      setWards(wardsData);
      setNurses(nursesData);
      setPendingTasks(tasksData);

      if (shiftsData.length > 0 && !createForm.shiftId) {
        setCreateForm((prev) => ({ ...prev, shiftId: shiftsData[0].id }));
      }
    } catch (err: any) {
      error('Failed to load handover reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openHandoverDetail = async (handover: Handover) => {
    try {
      const full = await api.getHandoverById(handover.id);
      setSelectedHandover(full);
      setIsDetailDrawerOpen(true);
    } catch (err) {
      error('Failed to load handover details');
    }
  };

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHandover(createForm);
      success('Shift handover filed. Awaiting incoming nurse digital signature.');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to file handover');
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedHandover) return;
    try {
      await api.acknowledgeHandover(selectedHandover.id, ackNote);
      success('Handover verified and digitally acknowledged.');
      setIsAckModalOpen(false);
      setIsDetailDrawerOpen(false);
      setAckNote('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to acknowledge handover');
    }
  };

  const handleFlagIncomplete = async (id: string) => {
    try {
      await api.flagIncompleteHandover(id, 'Flagged by clinical supervisor: incomplete task transfer');
      warning('Handover flagged as incomplete for audit.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to flag handover');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Shift Handover & Clinical Transition"
        subtitle="Standardized ISBAR shift-to-shift handover workflow and digital sign-off"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Handover' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setCreateForm({
                wardId: user?.wardId || (wards[0]?.id || ''),
                shiftId: shifts[0]?.id || '',
                date: new Date().toISOString().split('T')[0],
                incomingNurseId: '',
                notes: '',
                equipmentIssues: 'All patient monitors, oxygen flowmeters, and crash carts verified.',
                unresolvedIncidents: 'Nil medication incidents or patient falls during shift.',
                pendingTaskIds: pendingTasks.map((t) => t.id),
              });
              setIsCreateModalOpen(true);
            }}
          >
            File Outgoing Handover
          </Button>
        }
      />

      {/* Structured Handover Table */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Shift Date</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Shift Transition</th>
                  <th className="py-2.5 px-3">Outgoing Nurse</th>
                  <th className="py-2.5 px-3">Incoming Nurse</th>
                  <th className="py-2.5 px-3 text-center">Pending Tasks</th>
                  <th className="py-2.5 px-3">Handover Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {handovers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No shift handovers logged yet.
                    </td>
                  </tr>
                ) : (
                  handovers.map((h) => (
                    <tr
                      key={h.id}
                      onClick={() => openHandoverDetail(h)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {h.date}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {h.ward_name}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-semibold">
                        {h.shift_name} ({h.shift_code})
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        Sister {h.outgoing_nurse_name}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {h.incoming_nurse_name ? (
                          <span className="text-emerald-700 font-medium">Sister {h.incoming_nurse_name}</span>
                        ) : (
                          <span className="text-amber-600 italic">Awaiting Incoming RN</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {h.pendingTaskIds?.length || 0}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            h.status === 'ACKNOWLEDGED'
                              ? 'completed'
                              : h.status === 'INCOMPLETE'
                              ? 'danger'
                              : 'warning'
                          }
                          dot
                        >
                          {h.status === 'PENDING_ACKNOWLEDGEMENT' ? 'Pending Ack' : h.status}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {h.status === 'PENDING_ACKNOWLEDGEMENT' && (
                            <button
                              onClick={() => {
                                setSelectedHandover(h);
                                setIsAckModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            onClick={() => openHandoverDetail(h)}
                            className="px-2 py-1 text-xs text-teal-700 hover:bg-teal-50 rounded"
                          >
                            Inspect
                          </button>
                          {(isSupervisor || isAdmin) && h.status !== 'INCOMPLETE' && (
                            <button
                              onClick={() => handleFlagIncomplete(h.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                            >
                              Flag
                            </button>
                          )}
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

      {/* Handover Details Drawer */}
      {selectedHandover && (
        <Drawer
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title={`Shift Handover: ${selectedHandover.ward_name}`}
          subtitle={`${selectedHandover.shift_name} on ${selectedHandover.date}`}
          width="xl"
        >
          <div className="space-y-6 text-xs">
            {/* Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block">Outgoing Nurse</span>
                <span className="font-bold text-slate-900">
                  Sister {selectedHandover.outgoing_nurse_name} ({selectedHandover.outgoing_nurse_emp_id})
                </span>
              </div>
              <Badge
                variant={
                  selectedHandover.status === 'ACKNOWLEDGED'
                    ? 'completed'
                    : selectedHandover.status === 'INCOMPLETE'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedHandover.status}
              </Badge>
            </div>

            {/* Handover Notes & Summary */}
            <div className="bg-slate-50 p-4 rounded-clinical border border-slate-200 space-y-3">
              <div>
                <strong className="block text-slate-800 mb-1">Shift Clinical Summary & Notes:</strong>
                <p className="text-slate-700 leading-relaxed">
                  {selectedHandover.notes || 'Routine shift completed. All patients hemodynamically stable.'}
                </p>
              </div>

              <div>
                <strong className="block text-slate-800 mb-1">Equipment & Biomed Status:</strong>
                <p className="text-slate-700 leading-relaxed">{selectedHandover.equipment_issues}</p>
              </div>

              <div>
                <strong className="block text-slate-800 mb-1">Unresolved Incidents & Near-Misses:</strong>
                <p className="text-slate-700 leading-relaxed">{selectedHandover.unresolved_incidents}</p>
              </div>
            </div>

            {/* Pending Tasks Handed Over */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Pending Tasks Transferred to Incoming Shift ({selectedHandover.pendingTasks?.length || 0})
              </h3>
              <div className="border border-slate-200 rounded-clinical overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Task Title</th>
                      <th className="py-2 px-2">Patient / Bed</th>
                      <th className="py-2 px-2">Priority</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedHandover.pendingTasks?.map((pt) => (
                      <tr key={pt.id}>
                        <td className="py-2 px-3 font-medium text-slate-900">{pt.title}</td>
                        <td className="py-2 px-2 text-slate-600">{pt.patient_reference}</td>
                        <td className="py-2 px-2">
                          <Badge variant={pt.priority === 'Urgent' ? 'urgent' : 'medium'}>
                            {pt.priority}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-slate-500">{pt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acknowledgment Signature Status */}
            <div className="p-3.5 bg-slate-100/80 rounded-clinical border border-slate-200">
              <span className="font-bold text-slate-800 block text-xs mb-1">
                Digital Acknowledgment Record:
              </span>
              {selectedHandover.status === 'ACKNOWLEDGED' ? (
                <div className="text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Digitally signed and accepted by Sister {selectedHandover.incoming_nurse_name} at{' '}
                    {new Date(selectedHandover.acknowledged_at || '').toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="text-amber-800 text-xs flex items-center justify-between">
                  <span>Pending incoming nurse review and digital acceptance.</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAckModalOpen(true)}
                  >
                    Acknowledge Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* File Outgoing Handover Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="File Outgoing Shift Handover"
        subtitle="Document ward summary, transferred tasks, and equipment checks"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateHandover} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward *</label>
              <select
                required
                value={createForm.wardId}
                onChange={(e) => setCreateForm({ ...createForm, wardId: e.target.value })}
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
              <label className="block font-semibold text-slate-700 mb-1">Shift *</label>
              <select
                required
                value={createForm.shiftId}
                onChange={(e) => setCreateForm({ ...createForm, shiftId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} - {s.end_time})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incoming Nurse</label>
              <select
                value={createForm.incomingNurseId}
                onChange={(e) => setCreateForm({ ...createForm, incomingNurseId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="">Select incoming nurse (or float pool)</option>
                {nurses.map((n) => (
                  <option key={n.id} value={n.id}>
                    Sister {n.name} ({n.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              General Clinical Handover Notes *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Bed 4 spike in temp at 11:30, antibiotic started. Bed 2 on weaning trial with stable vitals."
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Equipment Status / Issues</label>
              <input
                type="text"
                value={createForm.equipmentIssues}
                onChange={(e) => setCreateForm({ ...createForm, equipmentIssues: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unresolved Incidents</label>
              <input
                type="text"
                value={createForm.unresolvedIncidents}
                onChange={(e) => setCreateForm({ ...createForm, unresolvedIncidents: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Shift Handover
            </Button>
          </div>
        </form>
      </Modal>

      {/* Acknowledge Handover Modal */}
      <Modal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        title="Digitally Acknowledge Shift Handover"
        subtitle="Confirm you have reviewed all patient summaries, pending tasks, and ward equipment"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded text-teal-900 leading-relaxed">
            By signing below, you confirm receipt of the clinical census and assume care responsibility for the upcoming shift as Sister <strong>{user?.name}</strong>.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Acknowledgment Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Reviewed all 6 critical care patients, accepted IV infusions and ABG monitoring schedule."
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAckModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAcknowledge}>
              Sign & Accept Duty
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
