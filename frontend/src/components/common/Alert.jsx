import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const Alert = ({ type = 'info', message, title }) => {
  const styles = {
    success: {
      bg: 'bg-mint-50 border-mint-200 text-mint-900',
      icon: FaCheckCircle,
      iconColor: 'text-mint-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: FaExclamationCircle,
      iconColor: 'text-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: FaExclamationTriangle,
      iconColor: 'text-amber-500',
    },
    info: {
      bg: 'bg-health-50 border-health-200 text-health-900',
      icon: FaInfoCircle,
      iconColor: 'text-health-500',
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
