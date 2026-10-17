import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base shadow-md',
  };

  const variantStyles = {
    primary: 'bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-400 shadow-rose-200 shadow-sm active:scale-[0.98]',
    secondary: 'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-400 shadow-sm active:scale-[0.98]',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 focus:ring-slate-300',
    ghost: 'bg-transparent hover:bg-rose-50 text-slate-600 hover:text-rose-600 focus:ring-rose-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 shadow-sm active:scale-[0.98]',
    white: 'bg-white hover:bg-rose-50 text-rose-600 font-extrabold shadow-xl focus:ring-rose-200 border-none active:scale-[0.98]',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
