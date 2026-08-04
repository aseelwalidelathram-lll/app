/**
 * Pictures.
 *
 * These do not go in the save file. localStorage caps out somewhere around
 * 5MB, and a handful of phone photos would blow past that and take the whole
 * save down with it — so images live in IndexedDB, which has no meaningful
 * limit, and the save only ever holds their ids.
 *
 * The trade is that images are not part of an export. That is stated plainly
 * in the Workshop rather than hidden: a save file stays a small, portable,
 * readable thing, which matters more than round-tripping a cover photo.
 */

const DB = 'lumen.images';
const STORE = 'images';

/** Phone cameras produce 4000px files. Nothing here is shown above ~700px. */
const MAX_EDGE = 1400;
const QUALITY = 0.82;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const request = fn(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Shrink on the way in, so what is stored is the size it will be displayed at
 * rather than whatever the camera happened to produce.
 */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 400_000) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  return blob ?? file;
}

export async function putImage(file: File): Promise<string> {
  const id = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  // Resolve the blob *before* opening the transaction. IndexedDB transactions
  // close as soon as they go idle, so awaiting inside one loses the write.
  const blob = await downscale(file);
  await tx('readwrite', (store) => store.put(blob, id));
  return id;
}

export async function deleteImage(id: string): Promise<void> {
  revoke(id);
  await tx('readwrite', (store) => store.delete(id));
}

/* --------------------------------------------------------- object URLs */

const urls = new Map<string, string>();

/** A displayable URL for a stored image, cached so repeated renders are free. */
export async function imageUrl(id: string): Promise<string | null> {
  const hit = urls.get(id);
  if (hit) return hit;
  const blob = await tx<Blob | undefined>('readonly', (store) => store.get(id));
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

function revoke(id: string) {
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
}
