import {openDesignDB} from '../editor/database.js';
import {accountOwner,accountKey} from './account-scope.js';
import {SYNC_STORES,SETTING_KEYS} from './sync-model.js';
import {validateDocument} from '../editor/document.js';
import {normalizeCampaign,parsePortable} from '../connected/model.js';
import {allElements} from '../editor/pages.js';
import {validateReview} from '../editor/reviews.js';
import {validateBrandKit} from '../premium/brand-kits.js';
import {validateVideo,blankVideo} from '../video/document.js';
import {readWorkspace} from '../workspace/local-store.js';
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9.:-]{1,120}$/.test(id);
async function rows(db,stores){return new Promise((resolve,reject)=>{const t=db.transaction(stores),result={};for(const store of stores){const r=t.objectStore(store).getAll();r.onsuccess=()=>result[store]=r.result;}t.oncomplete=()=>resolve(result);t.onabort=t.onerror=()=>reject(Error('Account cache could not be read.'));});}
export async function readAccountRecords(owner=accountOwner()){
 const db=await openDesignDB(owner);let data;try{data=await rows(db,[...SYNC_STORES,'sync-meta']);}finally{db.close();}
 const records=[];for(const store of SYNC_STORES)for(const raw of data[store]){const value={...raw};if(store==='media-backups'){const blob=value.blob;delete value.blob;records.push({key:`${store}/${raw.id}/source`,kind:'blob',value:blob});}records.push({key:`${store}/${raw.id}`,kind:'json',value});}
 for(const key of SETTING_KEYS){const value=localStorage.getItem(accountKey(key,owner));if(value!==null)records.push({key:'settings/'+key,kind:'json',value});}
 return{records,meta:data['sync-meta'].find(r=>r.id==='state')||null,generation:data['sync-meta'].find(r=>r.id==='generation')?.value||0};
}
export function validateAccountRecords(records){
 const stores=Object.fromEntries(SYNC_STORES.map(s=>[s,[]])),settings=new Map(),blobs=new Map(),seen=new Set();
 for(const r of records){if(!r||typeof r.key!=='string'||seen.has(r.key))throw Error('Duplicate account data.');seen.add(r.key);const [store,id,suffix]=r.key.split('/');
  if(store==='settings'){if(!SETTING_KEYS.includes(id)||suffix||typeof r.value!=='string'||r.value.length>100000)throw Error('Invalid account preferences.');if(id==='comvexa:creative-preview:v1')readWorkspace({getItem:()=>r.value});else if(id==='comvexa-theme'){if(!['light','dark'].includes(r.value))throw Error('Invalid account theme.');}else JSON.parse(r.value);settings.set(id,r.value);continue;}
  if(!SYNC_STORES.includes(store)||!validId(id))throw Error('Invalid account record.');
  if(suffix){if(store!=='media-backups'||suffix!=='source'||r.kind!=='blob'||!(r.value instanceof Blob))throw Error('Invalid account media.');blobs.set(id,r.value);continue;}
  const value=r.value&&typeof r.value==="object"?{...r.value}:null;if(!value||value.id!==id)throw Error('Account record identifier mismatch.');
  if(store==='designs'){validateDocument(value.document);if(!Number.isSafeInteger(value.revision)||value.revision<1||!Number.isFinite(Date.parse(value.updatedAt)))throw Error('Invalid saved design revision.');}
  if(store==='reviews')validateReview(value);
  if(store==='revisions'){parsePortable(value.portable);if(!validId(value.designId)||!Number.isSafeInteger(value.revision)||value.revision<1)throw Error('Invalid saved history.');}
  if(store==='brand-kits')validateBrandKit(value);
  stores[store].push(value);
 }
 for(const r of stores.packages)normalizeCampaign(r,stores.designs.map(d=>d.document));
 const campaigns=new Set(stores.packages.map(c=>c.id));for(const d of stores.designs)for(const e of allElements(d.document))if(e.binding&&!campaigns.has(e.binding.campaignId))throw Error('Account download is missing a connected campaign.');
 for(const media of stores['media-backups']){const blob=blobs.get(media.id);validateVideo({...blankVideo(),media:{[media.id]:media.metadata}});if(!blob||blob.size!==media.metadata.bytes)throw Error('Account download is missing complete original media.');media.blob=new Blob([blob],{type:media.metadata.mime});blobs.delete(media.id);}
 if(blobs.size)throw Error('Account contains orphan media sources.');
 for(const d of stores.designs)for(const id of Object.keys(d.document.video?.media||{}))if(!stores['media-backups'].some(m=>m.id===id))throw Error('Account download is missing a video/audio source.');
 return{stores,settings};
}
export async function writeAccountRecords(records,meta,{recovery=null,expectedGeneration}={}){
 const {stores,settings}=validateAccountRecords(records),db=await openDesignDB(accountOwner(),{track:false});
 try{await new Promise((resolve,reject)=>{const t=db.transaction([...SYNC_STORES,'sync-meta','sync-recovery'],'readwrite');t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(Error('Account download could not be saved. Existing device work was preserved.'));const check=t.objectStore('sync-meta').get('generation');check.onsuccess=()=>{if(expectedGeneration!==undefined&&(check.result?.value||0)!==expectedGeneration){t.abort();return;}try{t.objectStore('sync-meta').put({id:'generation',value:(check.result?.value||0)+1});for(const store of SYNC_STORES){const s=t.objectStore(store);s.clear();for(const record of stores[store])s.put(record);}t.objectStore('sync-meta').put({...meta,id:'state',settings:[...settings],settingsPending:true});if(recovery){const s=t.objectStore('sync-recovery');s.put({id:String(Date.now()),records:recovery,createdAt:new Date().toISOString()});const r=s.getAllKeys();r.onsuccess=()=>r.result.sort().slice(0,-3).forEach(key=>s.delete(key));}}catch{t.abort();}};});}finally{db.close();}
 applySettings(settings);
 await saveSyncMeta({...meta,settings:[...settings],settingsPending:false});
 if(typeof window!=='undefined'){window.dispatchEvent(new Event('storage'));window.dispatchEvent(new Event('comvexa-design-change'));window.dispatchEvent(new Event('comvexa-asset-preferences'));}
}
function applySettings(settings){for(const key of SETTING_KEYS){const name=accountKey(key);if(settings.has(key))localStorage.setItem(name,settings.get(key));else localStorage.removeItem(name);}const theme=settings.get('comvexa-theme');if(typeof document!=='undefined'&&theme)document.documentElement.dataset.theme=theme;}
export async function repairSettings(){const db=await openDesignDB();try{const data=await rows(db,['sync-meta']);const meta=data['sync-meta'].find(r=>r.id==='state');if(meta?.settingsPending){applySettings(new Map(meta.settings));await saveSyncMeta({...meta,settingsPending:false});}}finally{db.close();}}
export async function saveSyncMeta(meta){const db=await openDesignDB();try{await new Promise((resolve,reject)=>{const t=db.transaction('sync-meta','readwrite');t.objectStore('sync-meta').put({...meta,id:'state'});t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(Error('Could not checkpoint account sync.'));});}finally{db.close();}}
async function readLegacy(name,store){return new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore(store,{keyPath:'id'});r.onerror=()=>reject(r.error);r.onsuccess=async()=>{try{resolve((await rows(r.result,[store]))[store]);}catch(e){reject(e);}finally{r.result.close();}};});}
export async function guestRecords(){const {records}=await readAccountRecords(null);for(const brand of await readLegacy('comvexa-creative-v1','brand-kits'))if(!records.some(r=>r.key===`brand-kits/${brand.id}`))records.push({key:`brand-kits/${brand.id}`,kind:'json',value:brand});for(const media of await readLegacy('comvexa-media-v1','media'))if(!records.some(r=>r.key===`media-backups/${media.id}`)){const {blob,...value}=media;records.push({key:`media-backups/${media.id}`,kind:'json',value},{key:`media-backups/${media.id}/source`,kind:'blob',value:blob});}return records;}
export async function recoverySnapshots(){const db=await openDesignDB();try{return(await rows(db,['sync-recovery']))['sync-recovery'].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}finally{db.close();}}
export async function restoreRecoverySnapshot(id){const snapshots=await recoverySnapshots(),snapshot=snapshots.find(s=>s.id===id);if(!snapshot)throw Error('Recovery snapshot is no longer on this device.');const current=await readAccountRecords();await writeAccountRecords(snapshot.records,current.meta,{expectedGeneration:current.generation,recovery:current.records});}
