/**
 * Local, per-device sticker gallery.
 *
 * Why IndexedDB and not the server:
 * Madbeka's core privacy promise is that the user's image never leaves their
 * device. Storing the generated sticker on our server would break that promise
 * and bloat our infra bill. IndexedDB lets us keep a rich gallery experience
 * while staying 100% client-side.
 *
 * Trade-off: the gallery doesn't follow the user across devices. That's the
 * right call for a free/₪29-one-time product — users who need cross-device
 * sync can re-upload, and it keeps our data surface (and liability) tiny.
 */

const DB_NAME = "madbeka-gallery";
const DB_VERSION = 1;
const STORE_NAME = "stickers";

export interface GalleryEntry {
  id: string;
  blob: Blob;
  createdAt: number; // unix ms
  label?: string; // optional tag like "כלב של דני"
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save a generated sticker to the user's local gallery. Best-effort — never throws. */
export async function saveToGallery(blob: Blob, label?: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: GalleryEntry = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `stk_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        blob,
        createdAt: Date.now(),
        label,
      };
      store.add(entry);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("saveToGallery failed:", err);
  }
}

/** List all stickers, newest first. Returns [] on error. */
export async function listGallery(): Promise<GalleryEntry[]> {
  try {
    const db = await openDB();
    const items = await new Promise<GalleryEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as GalleryEntry[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn("listGallery failed:", err);
    return [];
  }
}

/** Permanently remove a sticker from the local gallery. */
export async function deleteFromGallery(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("deleteFromGallery failed:", err);
  }
}

/** Total count of stickers in the local gallery. */
export async function countGallery(): Promise<number> {
  try {
    const db = await openDB();
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return count;
  } catch {
    return 0;
  }
}
