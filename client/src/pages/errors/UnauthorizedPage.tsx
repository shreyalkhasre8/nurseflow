import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">403 — Clinical Access Restricted</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
        Your current clinical role does not possess permissions to view or execute procedures on this screen.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          Back to Authorized Dashboard
        </Button>
      </Link>
    </div>
  );
};
