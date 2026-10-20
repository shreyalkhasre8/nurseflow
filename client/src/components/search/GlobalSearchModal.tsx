import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, Package, Users, BookOpen, ArrowRightLeft, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { SearchResults } from '../../types';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.globalSearch(query.trim());
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  if (!isOpen) return null;

  const hasAnyResults =
    results &&
    (results.tasks.length > 0 ||
      results.inventory.length > 0 ||
      results.staff.length > 0 ||
      results.registers.length > 0 ||
      results.handovers.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-auto max-w-2xl transform overflow-hidden rounded-clinical-lg bg-white shadow-2xl ring-1 ring-black/5 transition-all">
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 flex items-center px-4">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="h-14 w-full border-0 bg-transparent pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base"
            placeholder="Search tasks, medications, patients, staff, registers... (Press Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-teal-600 mr-2" />}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 letters to search clinical tasks, staff roster, medicines, or registers.
            </div>
          )}

          {query && !isLoading && !hasAnyResults && (
            <div className="py-8 text-center text-xs text-slate-500">
              No clinical records found matching &ldquo;<span className="font-semibold text-slate-700">{query}</span>&rdquo;.
            </div>
          )}

          {results && results.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-teal-600" /> Tasks ({results.tasks.length})
              </div>
              <div className="space-y-1">
                {results.tasks.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/tasks`)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.patient_reference || 'General Ward Task'} • {t.ward_name}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {t.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.inventory.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600" /> Ward & Pharmacy Inventory ({results.inventory.length})
              </div>
              <div className="space-y-1">
                {results.inventory.map((i: any) => (
                  <button
                    key={i.id}
                    onClick={() => handleSelect(`/inventory`)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{i.name}</p>
                      <p className="text-xs text-slate-500">Code: {i.code} • Category: {i.category}</p>
                    </div>
                    <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {i.current_stock} {i.unit} in stock
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.staff.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" /> Hospital Staff ({results.staff.length})
              </div>
              <div className="space-y-1">
                {results.staff.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(`/staff`)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">Emp ID: {s.employee_id} • {s.role_name}</p>
                    </div>
                    <span className="text-xs text-slate-500">{s.ward_name || s.department_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.registers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" /> Digital Nursing Registers ({results.registers.length})
              </div>
              <div className="space-y-1">
                {results.registers.map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(`/registers`)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.register_name}</p>
                      <p className="text-xs text-slate-500">Date: {r.date} • Ward: {r.ward_name} • Author: {r.author_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.handovers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" /> Shift Handovers ({results.handovers.length})
              </div>
              <div className="space-y-1">
                {results.handovers.map((h: any) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelect(`/handover`)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {h.ward_name} ({h.shift_name}) - {h.date}
                      </p>
                      <p className="text-xs text-slate-500">Outgoing Nurse: {h.outgoing_nurse_name}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {h.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
