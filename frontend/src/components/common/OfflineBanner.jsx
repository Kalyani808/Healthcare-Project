import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { FaWifi, FaSyncAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const OfflineBanner = () => {
  const { isOffline, isSyncing, pendingCount, syncStatusMsg, flushSyncQueue } = useOffline();

  if (!isOffline && !isSyncing && !syncStatusMsg) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-bottom duration-200">
      {isOffline ? (
        <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <div>
              <p className="font-extrabold flex items-center space-x-1.5">
                <span>📡 Offline Mode</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.2 bg-amber-500/30 text-amber-300 rounded-full text-[10px] font-bold">
                    {pendingCount} unsynced
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-300 font-medium">
                Showing saved medical data. Actions will sync automatically when reconnected.
              </p>
            </div>
          </div>
        </div>
      ) : isSyncing ? (
        <div className="bg-teal-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-teal-700/80 flex items-center space-x-2.5 text-xs">
          <FaSyncAlt className="animate-spin text-teal-400 shrink-0" />
          <span className="font-bold">Syncing offline medical records with cloud...</span>
        </div>
      ) : syncStatusMsg ? (
        <div className="bg-emerald-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-700/80 flex items-center space-x-2 text-xs">
          <FaCheckCircle className="text-emerald-400 shrink-0" />
          <span className="font-bold">{syncStatusMsg}</span>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineBanner;
