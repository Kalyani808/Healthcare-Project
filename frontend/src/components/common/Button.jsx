import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/20 focus:ring-teal-500',
    teal: 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-500/20 focus:ring-teal-500',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 focus:ring-emerald-500',
    secondary: 'bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-slate-400 shadow-xs',
    soft: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 focus:ring-teal-400',
    outline: 'border-2 border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 focus:ring-teal-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20 focus:ring-rose-500',
    navy: 'bg-slate-900 text-white hover:bg-slate-800 shadow-md focus:ring-slate-700',
    mint: 'bg-gradient-to-r from-mint-500 to-tealSoft-500 text-white hover:from-mint-600 hover:to-tealSoft-600 shadow-md focus:ring-mint-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className="mr-2 text-base" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
