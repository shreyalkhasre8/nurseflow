import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">404 — Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
        The clinical screen or record you requested could not be found. It may have been archived or reassigned.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          Return to Clinical Dashboard
        </Button>
      </Link>
    </div>
  );
};
