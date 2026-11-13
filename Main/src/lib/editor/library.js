import {openDesignDB} from './database.js';
import {designStore} from './store.js';
async function cacheOperation(store, mode, action) {
 const db=await openDesignDB();
 try {return await new Promise((resolve,reject)=>{const t=db.transaction(store,mode);const r=action(t.objectStore(store));let value;r.onsuccess=()=>{value=r.result;};t.oncomplete=()=>resolve(value);t.onabort=t.onerror=()=>reject(t.error||new Error('Storage operation failed.'));});}finally{db.close();}
}
export const previewCache={
 get:id=>cacheOperation('thumbnails','readonly',s=>s.get(id)),
 put:record=>cacheOperation('thumbnails','readwrite',s=>s.put(record)),
};
export async function setDesignTrashed(id, trashed=true){
 const db=await openDesignDB();try{return await new Promise((resolve,reject)=>{const t=db.transaction('designs','readwrite'),s=t.objectStore('designs'),r=s.get(id);r.onsuccess=()=>{if(!r.result){t.abort();return;}s.put({...r.result,trashedAt:trashed?new Date().toISOString():null});};t.oncomplete=resolve;t.onerror=t.onabort=()=>reject(new Error('Could not update design.'));});}finally{db.close();}
}
export async function renameDesign(id,name){
 const record=await designStore.load(id);if(!record)throw new Error('Design not found.');
 return designStore.save(id,{...record.document,name:name.trim()},record.revision);
}
export async function duplicateDesign(id,newId){
 const record=await designStore.load(id);if(!record)throw new Error('Design not found.');
 // Save through connected storage so shared fields and original asset references stay intact.
 await designStore.save(newId,{...record.document,name:(record.document.name+' copy').slice(0,80)},0);
 return newId;
}
