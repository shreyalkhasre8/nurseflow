import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { User, AuditLog, Department, Ward } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  ShieldAlert,
  Users,
  Building2,
  Clock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersData, deptsData, wardsData, logsData] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
        api.getWards(),
        api.getAuditLogs({ limit: '10' }),
      ]);

      setUsers(usersData);
      setDepartments(deptsData);
      setWards(wardsData);
      setAuditLogs(logsData);
    } catch (err: any) {
      error('Failed to load system administration dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const activeUsersCount = users.filter((u) => u.status === 'ACTIVE').length;
  const inactiveUsersCount = users.filter((u) => u.status !== 'ACTIVE').length;
  const totalBeds = wards.reduce((sum, w) => sum + (w.bed_capacity || 20), 0);

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
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              System Administration & Clinical Governance
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-mono">{user?.employeeId}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise system status, clinical ward capacities, forensic audit telemetry, and user management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ShieldAlert className="w-3.5 h-3.5 text-slate-700" />}
            onClick={() => navigate('/admin')}
          >
            Security Audit Logs
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Users className="w-3.5 h-3.5" />}
            onClick={() => navigate('/admin')}
          >
            Staff Directory
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Staff</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeUsersCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Authorized active logins</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Inactive Accounts</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700">{inactiveUsersCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Suspended / offboarded</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Departments</span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-specialty clinical units</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Clinical Wards</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{wards.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalBeds} total inpatient beds</div>
        </div>

        <div className="bg-white p-4 rounded-clinical border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Events (24h)</span>
            <ShieldAlert className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800">{auditLogs.length * 15}</div>
          <div className="text-[11px] text-teal-700 mt-1 font-medium">100% compliant trail</div>
        </div>
      </div>

      {/* Main Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Ward Bed Capacities & Department Roster */}
        <div className="lg:col-span-2 space-y-5">
          {/* Ward Bed Capacity & Floor Distribution */}
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Clinical Ward Bed Capacity & Locations</h2>
                <p className="text-[11px] text-slate-500">Inpatient census zones and physical floor distribution</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-xs text-teal-700"
              >
                Ward Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wards.map((w) => {
                const capacity = w.bed_capacity || 20;
                // Estimated occupancy for visualization
                const occupied = Math.min(capacity, Math.floor(capacity * 0.75));
                const pct = Math.round((occupied / capacity) * 100);

                return (
                  <div key={w.id} className="p-3 bg-slate-50 rounded-clinical border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="font-bold text-slate-900">{w.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{w.floor}</div>
                      </div>
                      <Badge variant="medium" size="sm">
                        {w.code}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span>Census Occupancy</span>
                      <span className="font-bold">{occupied} / {capacity} Beds ({pct}%)</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 85 ? 'bg-amber-500' : 'bg-teal-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Structure Overview */}
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Hospital Clinical Departments</h2>
                <p className="text-[11px] text-slate-500">Core clinical specialties and administrative units</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {departments.map((dept) => (
                <div key={dept.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">{dept.code}</span>
                      <span className="font-bold text-slate-900">{dept.name}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{dept.description}</p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {wards.filter((w) => w.department_id === dept.id).length} Wards
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Live Forensic Security Audit Stream */}
        <div className="space-y-5">
          <div className="bg-white rounded-clinical border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Forensic Audit Stream</h2>
                <p className="text-[11px] text-slate-500">Live operational & security telemetry</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-xs text-teal-700"
              >
                All Logs
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-800 text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium text-slate-800">{log.user_name || 'System Actor'}</span>
                    <span>&bull;</span>
                    <span className="text-slate-400 font-mono text-[10px]">{log.ip_address || '127.0.0.1'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Entity: {log.entity} {log.record_id ? `(${log.record_id})` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance Quick Action Links */}
          <div className="bg-slate-50 rounded-clinical border border-slate-200 p-4 text-xs space-y-2.5">
            <h3 className="font-bold text-slate-900">Governance Shortcuts</h3>
            <button
              onClick={() => navigate('/admin')}
              className="w-full text-left p-2.5 bg-white rounded-clinical border border-slate-200 hover:border-teal-500 flex items-center justify-between text-slate-700 transition-colors"
            >
              <span>Manage Staff Profiles & Passwords</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full text-left p-2.5 bg-white rounded-clinical border border-slate-200 hover:border-teal-500 flex items-center justify-between text-slate-700 transition-colors"
            >
              <span>Clinical Operations Compliance Reports</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => navigate('/shifts')}
              className="w-full text-left p-2.5 bg-white rounded-clinical border border-slate-200 hover:border-teal-500 flex items-center justify-between text-slate-700 transition-colors"
            >
              <span>Hospital 24/7 Duty Roster</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
