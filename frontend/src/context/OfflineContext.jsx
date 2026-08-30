import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  getPendingSyncActions,
  removeSyncAction
} from '../utils/offlineStorage';

const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const actions = await getPendingSyncActions();
      setPendingCount(actions.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  // Flush pending sync queue to backend
  const flushSyncQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      const actions = await getPendingSyncActions();
      if (!actions || actions.length === 0) {
        setPendingCount(0);
        return;
      }

      setIsSyncing(true);
      setSyncStatusMsg(`Syncing ${actions.length} offline action(s)...`);
      let successCount = 0;

      // Process actions in chronological order
      for (const action of actions) {
        try {
          if (action.type === 'mark-dose') {
            await api.post('/api/reminders/schedules/mark-dose/', action.payload);
            await removeSyncAction(action.id);
            successCount++;
          }
        } catch (err) {
          console.warn(`Failed to sync action #${action.id}:`, err);
          // If server error or conflict, do not block other actions
        }
      }

      const remaining = await getPendingSyncActions();
      setPendingCount(remaining.length);
      setIsSyncing(false);

      if (successCount > 0) {
        setSyncStatusMsg(`✓ Synced ${successCount} offline action(s) to cloud.`);
        // Dispatch window event so components can refresh
        window.dispatchEvent(new CustomEvent('offlineDataSynced', { detail: { count: successCount } }));
        setTimeout(() => setSyncStatusMsg(null), 4000);
      } else {
        setSyncStatusMsg(null);
      }
    } catch (err) {
      console.error('Error during offline sync flush:', err);
      setIsSyncing(false);
      setSyncStatusMsg(null);
    }
  }, [isSyncing]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOffline(false);
      flushSyncQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check for unsynced actions every 15s when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        flushSyncQueue();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [flushSyncQueue, refreshPendingCount]);

  return (
    <OfflineContext.Provider
      value={{
        isOffline,
        isSyncing,
        pendingCount,
        syncStatusMsg,
        refreshPendingCount,
        flushSyncQueue
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
