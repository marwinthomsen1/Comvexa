import { validateDocument } from "./document.js";
const DB = "comvexa-designs-v1";
function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("designs", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(
        new Error(
          "Browser design storage is unavailable. Export a project file to keep your work.",
        ),
      );
    r.onblocked = () =>
      reject(new Error("Close other editor tabs to open storage."));
  });
}
export const designStore = {
  async load(id) {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const t = db.transaction("designs", "readonly"),
          r = t.objectStore("designs").get(id);
        r.onsuccess = () => {
          try {
            resolve(
              r.result
                ? { ...r.result, document: validateDocument(r.result.document) }
                : null,
            );
          } catch (error) {
            reject(error);
          }
        };
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  },
  async list() {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const result = [];
        const request = db
          .transaction("designs", "readonly")
          .objectStore("designs")
          .openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(
              result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
            );
            return;
          }
          try {
            const record = cursor.value;
            const d = record.document;
            if (
              typeof d?.name !== "string" ||
              d.name.length > 80 ||
              !d.canvas ||
              typeof record.updatedAt !== "string"
            )
              throw new Error();
            result.push({
              id: record.id,
              name: d.name,
              canvas: { width: d.canvas.width, height: d.canvas.height },
              updatedAt: record.updatedAt,
            });
            cursor.continue();
          } catch {
            reject(
              new Error(
                "A saved design is unreadable. Existing records have been preserved.",
              ),
            );
          }
        };
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  },
  async save(id, document, expectedRevision) {
    document = validateDocument(document);
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const t = db.transaction("designs", "readwrite"),
          store = t.objectStore("designs"),
          r = store.get(id);
        let revision, error;
        r.onsuccess = () => {
          if ((r.result?.revision || 0) !== expectedRevision) {
            error = new Error(
              "This design changed in another tab. Export your project file, then reload to avoid overwriting it.",
            );
            t.abort();
            return;
          }
          revision = expectedRevision + 1;
          try {
            store.put({
              id,
              document,
              revision,
              updatedAt: new Date().toISOString(),
            });
          } catch {
            error = new Error(
              "Local save failed. Storage may be full or disabled. Download a project file.",
            );
            t.abort();
          }
        };
        t.oncomplete = () => resolve(revision);
        t.onabort = t.onerror = () =>
          reject(
            error ||
              new Error(
                "Local save failed. Storage may be full or disabled. Download a project file.",
              ),
          );
      });
    } finally {
      db.close();
    }
  },
};
