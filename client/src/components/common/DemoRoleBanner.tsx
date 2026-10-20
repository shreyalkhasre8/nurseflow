import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';

export const DemoRoleBanner: React.FC = () => {
  const { user, switchUserByEmail } = useAuth();
  const [switching, setSwitching] = React.useState(false);

  const roles = [
    { label: 'Nurse', name: 'Priya Sharma (MICU)', email: 'priya.sharma@nurseflow.local', role: 'Nurse' },
    { label: 'Supervisor', name: 'Sunita Rao (ICU)', email: 'sunita.rao@nurseflow.local', role: 'Head Nurse / Supervisor' },
    { label: 'Inventory Mgr', name: 'Rajesh Kumar (Stores)', email: 'rajesh.kumar@nurseflow.local', role: 'Inventory Manager' },
    { label: 'Admin', name: 'Dr. Ramesh Hegde', email: 'admin@nurseflow.local', role: 'Administrator' },
  ];

  const handleSwitch = async (email: string) => {
    if (user?.email === email) return;
    setSwitching(true);
    try {
      await switchUserByEmail(email);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-inner no-print">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-semibold text-teal-400">
          <ShieldCheck className="w-3.5 h-3.5" /> NurseFlow Clinical RBAC:
        </span>
        <span className="text-slate-300">
          Viewing as <strong className="text-white">{user?.name}</strong> ({user?.role})
          {user?.wardName ? ` • ${user.wardName}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-400 mr-1 hidden sm:inline">Quick Role Switch:</span>
        {roles.map((r) => {
          const isActive = user?.email === r.email;
          return (
            <button
              key={r.email}
              onClick={() => handleSwitch(r.email)}
              disabled={switching || isActive}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 flex items-center gap-1 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm ring-1 ring-teal-400 cursor-default'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={`Switch role to ${r.name}`}
            >
              {isActive && <UserCheck className="w-3 h-3 text-teal-300" />}
              {r.label}
            </button>
          );
        })}
        {switching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400 ml-1" />}
      </div>
    </div>
  );
};
