import React from 'react';

export type BadgeVariant =
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'completed'
  | 'pending'
  | 'in_progress'
  | 'cancelled'
  | 'warning'
  | 'danger'
  | 'success'
  | 'neutral'
  | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  dot = false,
}) => {
  const getVariantStyles = (): { bg: string; text: string; border: string; dotColor?: string } => {
    switch (variant) {
      case 'urgent':
      case 'danger':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dotColor: 'bg-red-600' };
      case 'high':
      case 'warning':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dotColor: 'bg-amber-500' };
      case 'medium':
      case 'in_progress':
        return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dotColor: 'bg-teal-600' };
      case 'low':
      case 'neutral':
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dotColor: 'bg-slate-400' };
      case 'completed':
      case 'success':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dotColor: 'bg-emerald-600' };
      case 'pending':
        return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dotColor: 'bg-sky-500' };
      case 'cancelled':
        return { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200', dotColor: 'bg-zinc-400' };
      case 'info':
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', dotColor: 'bg-slate-500' };
    }
  };

  const { bg, text, border, dotColor } = getVariantStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${bg} ${text} ${border} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
};
