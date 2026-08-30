/**
 * IndexedDB Offline Storage & Sync Queue Utility
 * Zero external dependencies, pure browser IndexedDB implementation.
 */

const DB_NAME = 'SevaHealthOfflineDB';
const DB_VERSION = 1;

const STORES = {
  PRESCRIPTIONS: 'prescriptions',
  REMINDERS: 'reminders',
  SYNC_QUEUE: 'sync_queue'
};

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this browser.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.PRESCRIPTIONS)) {
        db.createObjectStore(STORES.PRESCRIPTIONS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
        db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* ========================================================================= */
/* 1. PRESCRIPTIONS CACHE                                                    */
/* ========================================================================= */

export async function cachePrescription(doc) {
  if (!doc) return;
  const docId = doc.id || doc.document_id || `doc_${Date.now()}`;
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRESCRIPTIONS, 'readwrite');
    const store = tx.objectStore(STORES.PRESCRIPTIONS);

    const record = {
      id: docId,
      docName: doc.title || doc.name || doc.file_name || `Prescription #${docId}`,
      medicines: doc.medicines || doc.analyzed?.medicines || [],
      lab_report: doc.lab_report || doc.analyzed?.lab_report || null,
      raw_ocr: doc.extracted_text || doc.raw_ocr || '',
      analyzed: doc.analyzed || doc,
      created_at: doc.uploaded_at || doc.created_at || new Date().toISOString(),
      cached_at: new Date().toISOString()
    };

    store.put(record);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(record);
    });
  } catch (err) {
    console.warn('Failed to cache prescription offline:', err);
  }
}

export async function getCachedPrescriptions() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRESCRIPTIONS, 'readonly');
    const store = tx.objectStore(STORES.PRESCRIPTIONS);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to get cached prescriptions:', err);
    return [];
  }
}

export async function getCachedPrescriptionById(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRESCRIPTIONS, 'readonly');
    const store = tx.objectStore(STORES.PRESCRIPTIONS);
    const req = store.get(id);

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/* ========================================================================= */
/* 2. REMINDERS & TODAY SCHEDULE CACHE                                       */
/* ========================================================================= */

export async function cacheTodaySchedule(scheduleData) {
  if (!scheduleData) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.REMINDERS, 'readwrite');
    const store = tx.objectStore(STORES.REMINDERS);

    const record = {
      id: 'today_schedule',
      data: scheduleData,
      cached_at: new Date().toISOString()
    };

    store.put(record);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(record);
    });
  } catch (err) {
    console.warn('Failed to cache today schedule:', err);
  }
}

export async function getCachedTodaySchedule() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.REMINDERS, 'readonly');
    const store = tx.objectStore(STORES.REMINDERS);
    const req = store.get('today_schedule');

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export async function updateCachedDoseStatus(logId, status) {
  try {
    const cached = await getCachedTodaySchedule();
    if (!cached || !cached.slots) return;

    for (const slotKey of Object.keys(cached.slots)) {
      const items = cached.slots[slotKey].items || [];
      for (const item of items) {
        if (item.log_id === logId) {
          item.status = status;
          item.taken_at = status === 'taken' ? new Date().toISOString() : null;
        }
      }
    }

    // Recompute total and taken counts
    const allItems = Object.values(cached.slots).flatMap((s) => s.items || []);
    cached.total_doses = allItems.length;
    cached.taken_doses = allItems.filter((it) => it.status === 'taken').length;
    cached.adherence_pct = cached.total_doses > 0
      ? Math.round((cached.taken_doses / cached.total_doses) * 100)
      : 100;

    await cacheTodaySchedule(cached);
    return cached;
  } catch (err) {
    console.warn('Failed to update cached dose status:', err);
  }
}

/* ========================================================================= */
/* 3. OFFLINE PENDING SYNC QUEUE                                             */
/* ========================================================================= */

export async function enqueueSyncAction(type, payload) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);

    const action = {
      type,
      payload,
      createdAt: Date.now(),
      attempts: 0
    };

    const req = store.add(action);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(req.result);
    });
  } catch (err) {
    console.error('Failed to enqueue sync action:', err);
    return null;
  }
}

export async function getPendingSyncActions() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function removeSyncAction(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    store.delete(id);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {
    return false;
  }
}
