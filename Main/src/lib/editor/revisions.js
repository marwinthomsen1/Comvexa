import {openDesignDB} from './database.js';
import {portableEnvelope} from '../connected/model.js';
// Archive in the same transaction as the edit: either both commit or neither does.
export function archiveRevision(t, record, campaigns) {
 if (!record) return;
 const store=t.objectStore('revisions');
 const snapshot={id:`${record.id}:${record.revision}`,designId:record.id,revision:record.revision,updatedAt:record.updatedAt,portable:portableEnvelope(record.document,campaigns)};
 store.put(snapshot);
 const request=store.index('designId').getAll(record.id);
 request.onsuccess=()=>{
  const rows=request.result.sort((a,b)=>b.revision-a.revision);
  let bytes=0;
  rows.forEach((row,index)=>{bytes+=new TextEncoder().encode(JSON.stringify(row)).byteLength;if(index>=10||(index>0&&bytes>40*1024*1024))store.delete(row.id);});
 };
}
export async function listRevisions(designId) {
 const db=await openDesignDB();
 try{return await new Promise((resolve,reject)=>{const t=db.transaction('revisions'),r=t.objectStore('revisions').index('designId').getAll(designId);r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.revision-a.revision));r.onerror=()=>reject(r.error);});}finally{db.close();}
}
