import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Shift, ShiftAssignment, StaffAvailability, Ward, User } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CalendarDays,
  Plus,
  Clock,
  UserCheck,
  Building2,
  Calendar,
  AlertTriangle,
  UserX,
  Filter,
} from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { user, isSupervisor, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [nurses, setNurses] = useState<User[]>([]);
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  // Form states
  const [assignForm, setAssignForm] = useState({
    shiftId: '',
    userId: '',
    wardId: '',
    date: new Date().toISOString().split('T')[0],
    notes: 'Primary inpatient duty allocation',
  });

  const [availForm, setAvailForm] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'ON_LEAVE',
    reason: 'Approved annual clinical leave',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assignmentsData, shiftsData, wardsData, nursesData, availData] = await Promise.all([
        api.getShiftAssignments({ date: selectedDate }),
        api.getShiftTypes(),
        api.getWards(),
        api.getUsers({ roleId: 'role-nurse' }),
        api.getStaffAvailability(selectedDate),
      ]);

      setAssignments(assignmentsData);
      setShifts(shiftsData);
      setWards(wardsData);
      setNurses(nursesData);
      setAvailability(availData);

      if (shiftsData.length > 0 && !assignForm.shiftId) {
        setAssignForm((prev) => ({
          ...prev,
          shiftId: shiftsData[0].id,
          wardId: wardsData[0]?.id || '',
          userId: nursesData[0]?.id || '',
        }));
      }
    } catch (err: any) {
      error('Failed to load shift assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignShift(assignForm);
      success('Staff nurse assigned to shift successfully.');
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to assign shift');
    }
  };

  const handleSetAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.setStaffAvailability(availForm);
      success('Staff absence / availability status recorded.');
      setIsAvailabilityModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to record availability');
    }
  };

  const handleStatusChange = async (assignmentId: string, status: string) => {
    try {
      await api.updateAssignmentStatus(assignmentId, status);
      success(`Duty status updated to ${status}`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update duty status');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Shift Scheduling & Staff Roster"
        subtitle="Manage daily clinical coverage, ward nurse-to-bed ratios, and duty rosters"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Shifts' }]}
        actions={
          (isSupervisor || isAdmin) && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<UserX className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => {
                  setAvailForm({
                    userId: nurses[0]?.id || '',
                    date: selectedDate,
                    status: 'ON_LEAVE',
                    reason: 'Casual leave',
                  });
                  setIsAvailabilityModalOpen(true);
                }}
              >
                Log Leave / Absence
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setAssignForm({
                    shiftId: shifts[0]?.id || '',
                    wardId: wards[0]?.id || '',
                    userId: nurses[0]?.id || '',
                    date: selectedDate,
                    notes: 'Rostered shift duty',
                  });
                  setIsAssignModalOpen(true);
                }}
              >
                Roster Staff Nurse
              </Button>
            </div>
          )
        }
      />

      {/* Date Selector & Shift Overview Banner */}
      <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span className="font-semibold text-slate-800">Select Roster Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-clinical border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        {/* 3 Shift Time Blocks */}
        <div className="flex items-center gap-2">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3 text-teal-600" />
              <span className="font-bold">{s.name}:</span>
              <span className="font-mono text-[11px] text-slate-500">
                {s.start_time} - {s.end_time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave / Unavailable Staff Callout if any */}
      {availability.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-clinical text-xs flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-600" />
            <span>
              <strong>Staff On Leave Today ({availability.length}):</strong>{' '}
              {availability.map((a) => `${a.staff_name} (${a.status.replace('_', ' ')})`).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Roster Assignment Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Staff Nurse</th>
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Shift Timing</th>
                  <th className="py-2.5 px-3">Ward Location</th>
                  <th className="py-2.5 px-3">Duty Assignment Notes</th>
                  <th className="py-2.5 px-3">Duty Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No shift assignments scheduled for {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  assignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Sister {asg.staff_name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{asg.employee_id}</td>
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {asg.shift_name} ({asg.start_time} - {asg.end_time})
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {asg.ward_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                        {asg.notes || 'Inpatient bedside care'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            asg.status === 'ON_DUTY'
                              ? 'completed'
                              : asg.status === 'COMPLETED'
                              ? 'neutral'
                              : asg.status === 'ABSENT'
                              ? 'danger'
                              : 'pending'
                          }
                          dot
                        >
                          {asg.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {(isSupervisor || isAdmin) && (
                          <select
                            value={asg.status}
                            onChange={(e) => handleStatusChange(asg.id, e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 bg-white"
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="ON_DUTY">On Duty</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ABSENT">Absent</option>
                            <option value="SWAPPED">Swapped</option>
                          </select>
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

      {/* Roster Staff Nurse Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Roster Staff Nurse to Shift"
        subtitle="Allocate clinical shift coverage and ward duty"
        maxWidth="md"
      >
        <form onSubmit={handleAssignShift} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Nurse *</label>
            <select
              required
              value={assignForm.userId}
              onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              {nurses.map((n) => (
                <option key={n.id} value={n.id}>
                  Sister {n.name} ({n.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Type *</label>
              <select
                required
                value={assignForm.shiftId}
                onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
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
              <label className="block font-semibold text-slate-700 mb-1">Ward *</label>
              <select
                required
                value={assignForm.wardId}
                onChange={(e) => setAssignForm({ ...assignForm, wardId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Duty Assignment Notes</label>
            <input
              type="text"
              placeholder="e.g. Beds 1-6 in charge, ICU ventilator monitoring"
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Staff Absence Modal */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title="Record Staff Leave or Absence"
        subtitle="Documents approved leave, sick duty, or off-duty rotations"
        maxWidth="md"
      >
        <form onSubmit={handleSetAvailability} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Member *</label>
            <select
              required
              value={availForm.userId}
              onChange={(e) => setAvailForm({ ...availForm, userId: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              {nurses.map((n) => (
                <option key={n.id} value={n.id}>
                  Sister {n.name} ({n.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={availForm.date}
                onChange={(e) => setAvailForm({ ...availForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Absence Type</label>
              <select
                value={availForm.status}
                onChange={(e) => setAvailForm({ ...availForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="ON_LEAVE">Approved Leave</option>
                <option value="SICK">Medical / Sick Leave</option>
                <option value="OFF_DUTY">Compensatory Off</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Clinical Note</label>
            <input
              type="text"
              value={availForm.reason}
              onChange={(e) => setAvailForm({ ...availForm, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAvailabilityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Absence Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
