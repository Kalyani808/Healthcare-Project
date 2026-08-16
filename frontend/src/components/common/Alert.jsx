import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const Alert = ({ type = 'info', message, title }) => {
  const styles = {
    success: {
      bg: 'bg-mint-50 dark:bg-mint-950/40 border-mint-200 dark:border-mint-800/60 text-mint-900 dark:text-mint-200',
      icon: FaCheckCircle,
      iconColor: 'text-mint-500 dark:text-mint-400',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
      icon: FaExclamationCircle,
      iconColor: 'text-rose-500 dark:text-rose-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
      icon: FaExclamationTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    info: {
      bg: 'bg-health-50 dark:bg-health-950/40 border-health-200 dark:border-health-800/60 text-health-900 dark:text-health-200',
      icon: FaInfoCircle,
      iconColor: 'text-health-500 dark:text-health-400',
    },
  };

  const currentStyle = styles[type] || styles.info;
  const Icon = currentStyle.icon;

  return (
    <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs leading-relaxed ${currentStyle.bg}`}>
      <Icon className={`text-lg shrink-0 mt-0.5 ${currentStyle.iconColor}`} />
      <div className="space-y-0.5">
        {title && <h5 className="font-bold text-sm">{title}</h5>}
        {message && <p className="font-medium">{message}</p>}
      </div>
    </div>
  );
};

export default Alert;
