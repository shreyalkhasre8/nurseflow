import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Ward } from '../../types';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Users, Phone, Mail, Building2, Search, Award } from 'lucide-react';

export const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      setIsLoading(true);
      try {
        const [usersData, wardsData] = await Promise.all([
          api.getUsers({ search, wardId: wardFilter }),
          api.getWards(),
        ]);
        setStaff(usersData);
        setWards(wardsData);
      } catch (err) {
        console.error('Failed to load staff directory:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStaff();
  }, [search, wardFilter]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Hospital Clinical Staff Directory"
        subtitle="Contact information, nursing council registration, and ward assignments"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff' }]}
      />

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-clinical border border-slate-200 shadow-sm flex flex-wrap items-center gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name, employee ID, or qualification..."
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
          <option value="ALL">All Departments & Wards</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-clinical border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition-colors text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <span className="font-mono text-[11px] text-teal-800 font-semibold block">
                      {s.employeeId}
                    </span>
                  </div>
                  <Badge variant={s.role === 'Nurse' ? 'medium' : 'neutral'}>
                    {s.role}
                  </Badge>
                </div>

                {s.qualification && (
                  <p className="text-[11px] text-slate-600 flex items-center gap-1.5 mb-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.qualification}</span>
                  </p>
                )}

                <div className="space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.wardName || s.departmentName || 'Central'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {s.registrationNo && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  Council Reg: {s.registrationNo}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
