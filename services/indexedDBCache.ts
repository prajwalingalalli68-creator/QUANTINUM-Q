const DB_NAME = 'quantinum_db';
const DB_VERSION = 1;
const CHAT_STORE = 'chat_history';
const SETTINGS_STORE = 'settings';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        db.createObjectStore(CHAT_STORE);
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const getCachedData = <T>(storeName: string, key: string): Promise<T | null> => {
  return initDB().then((db) => {
    return new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }).catch((err) => {
    console.warn('IndexedDB read failed, falling back', err);
    return null;
  });
};

export const setCachedData = <T>(storeName: string, key: string, value: T): Promise<void> => {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }).catch((err) => {
    console.warn('IndexedDB write failed', err);
  });
};

export const clearCachedData = (storeName: string, key: string): Promise<void> => {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }).catch((err) => {
    console.warn('IndexedDB clear failed', err);
  });
};

// Convenient wrappers
export const getChatHistory = <T>(): Promise<T | null> => {
  return getCachedData<T>(CHAT_STORE, 'current_messages');
};

export const saveChatHistory = <T>(messages: T): Promise<void> => {
  return setCachedData<T>(CHAT_STORE, 'current_messages', messages);
};

export const clearChatHistory = (): Promise<void> => {
  return clearCachedData(CHAT_STORE, 'current_messages');
};

export const getSetting = <T>(key: string): Promise<T | null> => {
  return getCachedData<T>(SETTINGS_STORE, key);
};

export const saveSetting = <T>(key: string, value: T): Promise<void> => {
  return setCachedData<T>(SETTINGS_STORE, key, value);
};
