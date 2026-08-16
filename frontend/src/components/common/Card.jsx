import React from 'react';

const Card = ({ children, className = '', hoverable = false, padding = 'p-6' }) => {
  return (
    <div
      className={`bg-white dark:bg-[#172033] rounded-3xl border border-slate-100/80 dark:border-slate-700/60 shadow-card dark:shadow-darkCard transition-all duration-300 ${
        hoverable ? 'hover:shadow-soft hover:-translate-y-0.5 hover:border-health-100 dark:hover:border-health-500/40' : ''
      } ${padding} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
