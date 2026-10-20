import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, ShieldCheck, Lock, Mail, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('priya.sharma@nurseflow.local');
  const [password, setPassword] = useState('hospital123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setUsername(demoEmail);
    setPassword('hospital123');
    setError(null);
    setIsLoading(true);
    try {
      await login(demoEmail, 'hospital123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-clinical-lg bg-teal-700 text-white shadow-md mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">NurseFlow</h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Nursing Workflow, Digital Registers & Ward Inventory System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-clinical-lg sm:px-8">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-base font-semibold text-slate-800">Clinical Staff Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your hospital Employee ID or registered email address.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-clinical flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employee ID or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. NF-NUR-101 or priya.sharma@nurseflow.local"
                  className="w-full text-xs rounded-clinical border border-slate-300 px-3 py-2 pl-9 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Shift Access Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs rounded-clinical border border-slate-300 px-3 py-2 pl-9 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2 font-semibold"
              isLoading={isLoading}
            >
              Sign In to Duty Shift
            </Button>
          </form>

          {/* Quick Demo Access Roles */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              1-Click Demo Evaluation Profiles:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('priya.sharma@nurseflow.local')}
                className="p-2 border border-slate-200 rounded-clinical hover:bg-teal-50 hover:border-teal-300 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Priya Sharma</div>
                <div className="text-[11px] text-teal-700">Staff Nurse (MICU)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('sunita.rao@nurseflow.local')}
                className="p-2 border border-slate-200 rounded-clinical hover:bg-teal-50 hover:border-teal-300 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Sunita Rao</div>
                <div className="text-[11px] text-teal-700">Head Nurse / Supervisor</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('rajesh.kumar@nurseflow.local')}
                className="p-2 border border-slate-200 rounded-clinical hover:bg-teal-50 hover:border-teal-300 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Rajesh Kumar</div>
                <div className="text-[11px] text-teal-700">Inventory Manager</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin@nurseflow.local')}
                className="p-2 border border-slate-200 rounded-clinical hover:bg-teal-50 hover:border-teal-300 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Dr. Ramesh Hegde</div>
                <div className="text-[11px] text-teal-700">Administrator</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Standard demo password for all accounts: <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">hospital123</code>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>NABH & HIPAA Compliant Clinical Workflow Session</span>
        </div>
      </div>
    </div>
  );
};
