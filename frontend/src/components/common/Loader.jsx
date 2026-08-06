import React from 'react';

const Loader = ({ label = 'Loading health portal...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-health-100 border-t-health-500 animate-spin"></div>
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
    </div>
  );
};

export default Loader;
