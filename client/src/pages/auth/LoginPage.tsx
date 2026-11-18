import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Activity, ShieldCheck, Lock, Mail, AlertCircle, Eye, EyeOff, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered credentials on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('nurseflow_remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!username.trim() || !password) {
      setError('Please enter both your Employee ID / Email and Shift Access Password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('nurseflow_remembered_username', username.trim());
      } else {
        localStorage.removeItem('nurseflow_remembered_username');
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your Employee ID and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setShowForgotModal(false);
      setInfoMessage(res.message || 'Password reset request dispatched to clinical IT administrator.');
      setForgotEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
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

          {infoMessage && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-clinical flex items-start gap-2.5 text-xs text-teal-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
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
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. nurse@nurseflow.demo or DEMO-NUR-01"
                  className="w-full text-xs rounded-clinical border border-slate-300 px-3 py-2 pl-9 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-colors"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs rounded-clinical border border-slate-300 px-3 py-2 pl-9 pr-9 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-medium text-teal-700 hover:text-teal-800 transition-colors focus:outline-none underline-offset-2 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-3 font-semibold shadow-sm"
              isLoading={isLoading}
            >
              Sign In to Duty Shift
            </Button>
          </form>
        </div>

        {/* Security and Governance footer */}
        <div className="mt-5 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>NABH & HIPAA Compliant Healthcare Operations Session</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-clinical-lg border border-slate-200 max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <HelpCircle className="w-5 h-5 text-teal-700" />
              <h3 className="font-semibold text-sm">Shift Password Recovery</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Enter your registered clinical email or employee ID. A verification token and reset notification will be routed to hospital IT administration.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hospital Email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. nurse@nurseflow.demo"
                  className="w-full text-xs rounded-clinical border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={forgotLoading}
                >
                  Request Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
