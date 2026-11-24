import {accountDatabase,accountOwner,accountChanged} from "../cloud/account-scope.js";
const DB = "comvexa-designs-v1";
export function openDesignDB(owner=accountOwner(),{track=true}={}) {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(accountDatabase(DB,owner), 6);
    let expired=false;
    const timeout=setTimeout(()=>{expired=true;reject(Error('Browser storage is taking too long to open. Close other Comvexa tabs, then retry.'));},12000);
    r.onupgradeneeded = () => {
      for(const name of ["brand-kits","sync-meta","sync-recovery"]) if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name,{keyPath:"id"});
      if (!r.result.objectStoreNames.contains("media-backups")) r.result.createObjectStore("media-backups", {keyPath:"id"});
      if (!r.result.objectStoreNames.contains("revisions")) {
        const revisions=r.result.createObjectStore("revisions", {keyPath:"id"});
        revisions.createIndex("designId", "designId");
      }
      if (!r.result.objectStoreNames.contains("reviews")) r.result.createObjectStore("reviews", {keyPath:"id"});
      if (!r.result.objectStoreNames.contains("thumbnails")) r.result.createObjectStore("thumbnails", {keyPath:"id"});
      if (!r.result.objectStoreNames.contains("designs"))
        r.result.createObjectStore("designs", { keyPath: "id" });
      if (!r.result.objectStoreNames.contains("packages"))
        r.result.createObjectStore("packages", { keyPath: "id" });
    };
    r.onsuccess = () => {
      clearTimeout(timeout);if(expired){r.result.close();return;}
      r.result.onversionchange = () => r.result.close();
      const db=r.result,transaction=db.transaction.bind(db);
      db.transaction=(stores,mode,options)=>{const names=typeof stores==='string'?[stores]:[...stores],changing=mode==='readwrite'&&names.some(n=>!["sync-meta","sync-recovery","thumbnails"].includes(n));if(changing&&track&&!names.includes('sync-meta'))names.push('sync-meta');const t=transaction(names,mode,options);if(changing){if(track){const store=t.objectStore('sync-meta'),r=store.get('generation');r.onsuccess=()=>{try{store.put({id:'generation',value:(r.result?.value||0)+1});}catch{t.abort();}};}t.addEventListener('complete',accountChanged);}return t;};
      resolve(db);
    };
    r.onerror = () => {
      clearTimeout(timeout);reject(
        new Error(
          "Browser design storage is unavailable. Export a project file to keep your work.",
        ),
      );};
    r.onblocked = () => {clearTimeout(timeout);expired=true;
      reject(new Error("Close other Comvexa tabs, then retry opening your workspace."));};
  });
}
