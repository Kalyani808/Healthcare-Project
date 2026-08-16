import React from 'react';

const Card = ({ children, className = '', hoverable = false, padding = 'p-6' }) => {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100/80 shadow-card transition-all duration-300 ${
        hoverable ? 'hover:shadow-soft hover:-translate-y-0.5 hover:border-health-100' : ''
      } ${padding} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
