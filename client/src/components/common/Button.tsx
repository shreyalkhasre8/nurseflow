import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm border border-transparent focus:ring-teal-500';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm border border-transparent focus:ring-slate-500';
      case 'outline':
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-teal-500';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent focus:ring-red-500';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent focus:ring-slate-400';
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1.5 text-xs';
      case 'lg':
        return 'px-5 py-2.5 text-base';
      case 'md':
      default:
        return 'px-3.5 py-2 text-sm';
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-clinical transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
      ) : icon ? (
        <span className="mr-2 shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
