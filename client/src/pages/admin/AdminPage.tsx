import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { User, AuditLog, Department, Ward } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Users,
  ShieldAlert,
  Building2,
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  History,
  Lock,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'wards'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('hospital123');

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: 'hospital123',
    roleId: 'role-nurse',
    departmentId: '',
    wardId: '',
    phone: '',
    qualification: 'B.Sc. Nursing',
    registrationNo: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, deptsData, wardsData, rolesData] = await Promise.all([
        api.getUsers({ roleId: roleFilter, search }),
        api.getDepartments(),
        api.getWards(),
        api.getRoles(),
      ]);

      setUsersList(usersData);
      setDepartments(deptsData);
      setWards(wardsData);
      setRoles(rolesData);

      if (activeTab === 'audit') {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      error('Failed to load administration data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, roleFilter, search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUserForm);
      success(`User account created for ${newUserForm.name}.`);
      setIsCreateUserModalOpen(false);
      setNewUserForm({
        employeeId: '',
        name: '',
        email: '',
        password: 'hospital123',
        roleId: 'role-nurse',
        departmentId: '',
        wardId: '',
        phone: '',
        qualification: 'B.Sc. Nursing',
        registrationNo: '',
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateUser(targetUser.id, { status: newStatus });
      success(`Account status for ${targetUser.name} set to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      error('Failed to update user status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    try {
      await api.resetUserPassword(selectedUserForReset.id, newPassword);
      success(`Password reset successfully for ${selectedUserForReset.name}.`);
      setIsResetPasswordModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Hospital System Administration"
        subtitle="Manage clinical staff accounts, role-based access, inpatient wards, and security audit logs"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }]}
        actions={
          activeTab === 'users' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setNewUserForm({
                  ...newUserForm,
                  departmentId: departments[0]?.id || '',
                  wardId: wards[0]?.id || '',
                });
                setIsCreateUserModalOpen(true);
              }}
            >
              Add Staff Member
            </Button>
          )
        }
      />

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff User Accounts ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          System Security & Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('wards')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'wards'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Departments & Inpatient Wards
        </button>
      </div>

      {/* 1. User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search staff name, employee ID or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-clinical border border-slate-300 text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-clinical border border-slate-300 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">All Clinical Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-4">Staff Name</th>
                      <th className="py-2.5 px-3">Employee ID</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Department / Ward</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {u.name}
                          {u.qualification && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {u.qualification}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-teal-800">
                          {u.employeeId}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                          {u.role}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {u.wardName || u.departmentName || 'Central'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {u.email}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant={u.status === 'ACTIVE' ? 'completed' : 'danger'} dot>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                u.status === 'ACTIVE'
                                  ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForReset(u);
                                setNewPassword('hospital123');
                                setIsResetPasswordModalOpen(true);
                              }}
                              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                              title="Reset Password"
                            >
                              Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-clinical border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Complete System Audit Trail (Immutable Log)
            </span>
            <span className="text-slate-400">Captures all login, task, register and stock operations</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Clinical Entity</th>
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-4">Audit Details & Changed Attributes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-800 whitespace-nowrap">
                      {log.user_name || 'System Auto'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-700 whitespace-nowrap">{log.entity}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{log.record_id || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 font-sans text-slate-600 max-w-sm truncate">
                      {typeof log.detailsParsed === 'object'
                        ? JSON.stringify(log.detailsParsed)
                        : String(log.details || '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Wards & Departments Tab */}
      {activeTab === 'wards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {departments.map((dept) => {
            const deptWards = wards.filter((w) => w.department_id === dept.id);
            return (
              <div key={dept.id} className="bg-white rounded-clinical border border-slate-200 p-5 shadow-sm text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    <h3 className="font-bold text-slate-900 text-sm">{dept.name} ({dept.code})</h3>
                  </div>
                  <span className="text-slate-400">{deptWards.length} wards</span>
                </div>
                <p className="text-slate-500 leading-relaxed">{dept.description}</p>

                <div className="space-y-2 pt-1">
                  {deptWards.map((w) => (
                    <div
                      key={w.id}
                      className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{w.name}</span>
                        <span className="text-[11px] text-slate-400 block">{w.floor}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-teal-800">{w.bed_capacity} Beds</span>
                        <span className="text-[11px] text-slate-400 block">
                          {w.active_staff_count || 2} nurses rostered
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        title="Create Hospital Staff Account"
        subtitle="Onboard a new nurse, supervisor, or inventory officer into the system"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. NF-NUR-109"
                value={newUserForm.employeeId}
                onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sister Meena Kumari"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Hospital Email *</label>
              <input
                type="email"
                required
                placeholder="meena.kumari@nurseflow.local"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
              <select
                required
                value={newUserForm.roleId}
                onChange={(e) => setNewUserForm({ ...newUserForm, roleId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-medium"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newUserForm.departmentId}
                onChange={(e) => setNewUserForm({ ...newUserForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Ward</label>
              <select
                value={newUserForm.wardId}
                onChange={(e) => setNewUserForm({ ...newUserForm, wardId: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                <option value="">No fixed ward (Float)</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Registration No.</label>
              <input
                type="text"
                placeholder="e.g. KNC-2022-4412"
                value={newUserForm.registrationNo}
                onChange={(e) => setNewUserForm({ ...newUserForm, registrationNo: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
              <input
                type="text"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title={`Reset Password for ${selectedUserForReset?.name}`}
        subtitle="Set a new secure password for this staff member"
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-clinical border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Commit Reset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
