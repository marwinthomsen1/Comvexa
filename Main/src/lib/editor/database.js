const DB = "comvexa-designs-v1";
export function openDesignDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 3);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("thumbnails")) r.result.createObjectStore("thumbnails", {keyPath:"id"});
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
