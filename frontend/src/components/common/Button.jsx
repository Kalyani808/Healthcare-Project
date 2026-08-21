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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-health-500 via-health-600 to-mint-500 text-white hover:from-health-600 hover:to-mint-600 shadow-md shadow-health-100 dark:shadow-none focus:ring-health-400',
    secondary: 'bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-slate-300 dark:focus:ring-slate-600 shadow-sm',
    soft: 'bg-health-50 dark:bg-health-950/50 text-health-700 dark:text-health-300 border border-health-100 dark:border-health-900/60 hover:bg-health-100 dark:hover:bg-health-900/80 focus:ring-health-300',
    mint: 'bg-gradient-to-r from-mint-500 to-tealSoft-500 text-white hover:from-mint-600 hover:to-tealSoft-600 shadow-md shadow-mint-100 dark:shadow-none focus:ring-mint-400',
    outline: 'border-2 border-health-500 text-health-600 dark:text-health-400 hover:bg-health-50 dark:hover:bg-health-950/50 focus:ring-health-300',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400 shadow-sm',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className="mr-2 text-lg" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
