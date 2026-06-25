/**
 * Local persistence (UI/UX manifesto technical requirement: "Use IndexedDB for
 * local storage — workspaces, preferences, notes").
 *
 * A tiny promise-based IndexedDB key/value store, namespaced by "store" name.
 * Falls back to an in-memory map when IndexedDB is unavailable (tests, SSR),
 * so callers never have to branch. Nothing here touches the network.
 */

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

const DB_NAME = 'b2030b';
const DB_VERSION = 1;
const STORES = ['prefs', 'spaces', 'notes', 'tasks', 'dashboard'] as const;
export type StoreName = (typeof STORES)[number];

class MemoryStore implements KeyValueStore {
  private m = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | undefined> {
    return this.m.get(key) as T | undefined;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.m.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.m.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.m.keys()];
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (): void => {
      const db = req.result;
      for (const s of STORES) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      }
    };
    req.onsuccess = (): void => resolve(req.result);
    req.onerror = (): void => reject(req.error);
  });
}

class IdbStore implements KeyValueStore {
  constructor(private readonly store: StoreName) {}

  private async tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await openDb();
    return db.transaction(this.store, mode).objectStore(this.store);
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.tx('readonly').then(
      (os) =>
        new Promise<T | undefined>((resolve, reject) => {
          const r = os.get(key);
          r.onsuccess = (): void => resolve(r.result as T | undefined);
          r.onerror = (): void => reject(r.error);
        }),
    );
  }
  set<T>(key: string, value: T): Promise<void> {
    return this.tx('readwrite').then(
      (os) =>
        new Promise<void>((resolve, reject) => {
          const r = os.put(value, key);
          r.onsuccess = (): void => resolve();
          r.onerror = (): void => reject(r.error);
        }),
    );
  }
  delete(key: string): Promise<void> {
    return this.tx('readwrite').then(
      (os) =>
        new Promise<void>((resolve, reject) => {
          const r = os.delete(key);
          r.onsuccess = (): void => resolve();
          r.onerror = (): void => reject(r.error);
        }),
    );
  }
  keys(): Promise<string[]> {
    return this.tx('readonly').then(
      (os) =>
        new Promise<string[]>((resolve, reject) => {
          const r = os.getAllKeys();
          r.onsuccess = (): void => resolve((r.result as IDBValidKey[]).map(String));
          r.onerror = (): void => reject(r.error);
        }),
    );
  }
}

/** Open a namespaced store, transparently falling back to memory. */
export function openStore(store: StoreName): KeyValueStore {
  try {
    if (typeof indexedDB !== 'undefined') return new IdbStore(store);
  } catch {
    /* fall through */
  }
  return new MemoryStore();
}
