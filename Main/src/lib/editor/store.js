import { validateDocument } from "./document.js";
import { validateCampaign } from "../templates/generate.js";
const DB = "comvexa-designs-v1";
function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("designs"))
        r.result.createObjectStore("designs", { keyPath: "id" });
      if (!r.result.objectStoreNames.contains("packages"))
        r.result.createObjectStore("packages", { keyPath: "id" });
    };
    r.onsuccess = () => {
      r.result.onversionchange = () => r.result.close();
      resolve(r.result);
    };
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
              provenance: d.provenance,
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
  async savePackage(bundle) {
    if (
      !bundle?.campaign ||
      !Array.isArray(bundle.designs) ||
      ![1, 4].includes(bundle.designs.length)
    )
      throw new Error("Invalid design package.");
    const ids = new Set(bundle.designs.map((d) => d.id));
    if (
      ids.size !== bundle.designs.length ||
      bundle.designs.some(
        (d) => typeof d.id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(d.id),
      )
    )
      throw new Error("Invalid design identifiers.");
    const campaign = {
      ...bundle.campaign,
      fields: validateCampaign(bundle.campaign.fields),
    };
    if (
      typeof campaign.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,64}$/.test(campaign.id) ||
      typeof campaign.name !== "string" ||
      !campaign.name.trim() ||
      campaign.name.length > 160 ||
      !Array.isArray(campaign.designIds) ||
      campaign.designIds.length !== ids.size ||
      !campaign.designIds.every((id) => ids.has(id))
    )
      throw new Error("Invalid campaign.");
    const designs = bundle.designs.map((d) => ({
      ...d,
      document: validateDocument(d.document),
    }));
    if (designs.some((d) => d.document.provenance?.campaignId !== campaign.id))
      throw new Error("Campaign references do not match.");
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const t = db.transaction(["designs", "packages"], "readwrite");
        let error;
        const abort = (message) => {
          error = new Error(message);
          t.abort();
        };
        const records = t.objectStore("designs"),
          packages = t.objectStore("packages");
        const check = packages.get(campaign.id);
        check.onsuccess = () => {
          if (check.result)
            abort(
              "This campaign already exists. Generate a new package to avoid overwriting it.",
            );
        };
        for (const d of designs) {
          const exists = records.get(d.id);
          exists.onsuccess = () => {
            if (exists.result)
              abort(
                "A design with this identifier already exists. Nothing was overwritten.",
              );
          };
        }
        try {
          const now = new Date().toISOString();
          for (const d of designs)
            records.add({
              id: d.id,
              document: d.document,
              revision: 1,
              updatedAt: now,
            });
          packages.add({ ...campaign, createdAt: now });
        } catch {
          abort(
            "Package save failed. Storage may be full. No designs were saved.",
          );
        }
        t.oncomplete = () => resolve(campaign.id);
        t.onabort = t.onerror = () =>
          reject(
            error ||
              new Error(
                "Package save failed. Storage may be full or disabled. No partial package was saved.",
              ),
          );
      });
    } finally {
      db.close();
    }
  },
  async listPackages() {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const r = db
          .transaction("packages", "readonly")
          .objectStore("packages")
          .getAll();
        r.onsuccess = () =>
          resolve(
            r.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          );
        r.onerror = () => reject(r.error);
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
