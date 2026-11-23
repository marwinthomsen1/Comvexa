export const CHUNK_BYTES=4*1024*1024,MAX_SYNC_BYTES=400*1024*1024,MAX_ENTRIES=5000;
export const SYNC_STORES=['designs','packages','reviews','revisions','brand-kits','media-backups'];
export const SETTING_KEYS=['comvexa:creative-preview:v1','comvexa-theme','comvexa-recent-fonts','comvexa-editor-workspace-v1','comvexa-asset-preferences-v1','comvexa-recent-templates'];
export function validateManifest(value){
 if(!value||value.version!==1||!Array.isArray(value.entries)||value.entries.length>MAX_ENTRIES)throw Error('Unsupported account snapshot.');
 const seen=new Set();let total=0;
 for(const entry of value.entries){if(!entry||typeof entry.key!=='string'||entry.key.length>180||seen.has(entry.key)||! /^(designs|packages|reviews|revisions|brand-kits|media-backups|settings)\/.+$/.test(entry.key)||!['json','blob'].includes(entry.kind)||!Number.isSafeInteger(entry.bytes)||entry.bytes<0||entry.bytes>100*1024*1024||!Array.isArray(entry.chunks)||entry.chunks.length!==Math.max(1,Math.ceil(entry.bytes/CHUNK_BYTES))||!entry.chunks.every(v=>/^[a-f0-9]{64}$/.test(v)))throw Error('Invalid account snapshot entry.');seen.add(entry.key);total+=entry.bytes;}
 if(total>MAX_SYNC_BYTES)throw Error('Account data exceeds the current 400 MB sync limit. Your device copy is preserved.');return value;
}
export function entrySignature(entry){return entry?`${entry.kind}:${entry.bytes}:${entry.chunks.join(',')}`:null;}
export function mergeManifests(base,local,remote,resolution=null){
 for(const m of [base,local,remote])validateManifest(m);
 const maps=[base,local,remote].map(m=>new Map(m.entries.map(e=>[e.key,e]))),keys=new Set(maps.flatMap(m=>[...m.keys()])),entries=[],conflicts=[];
 for(const key of [...keys].sort()){const [b,l,r]=maps.map(m=>m.get(key)),[bs,ls,rs]=[b,l,r].map(entrySignature);let next;
  if(ls===rs||rs===bs)next=l;else if(ls===bs)next=r;else{conflicts.push(key);next=resolution==='device'?l:resolution==='account'?r:undefined;}
  if(next)entries.push(next);
 }
 return{manifest:validateManifest({version:1,entries}),conflicts};
}
export const emptyManifest=()=>({version:1,entries:[]});
export async function hashBytes(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function packEntries(records){const chunks=new Map(),entries=[];for(const record of [...records].sort((a,b)=>a.key.localeCompare(b.key))){const bytes=record.kind==='blob'?new Uint8Array(await record.value.arrayBuffer()):new TextEncoder().encode(JSON.stringify(record.value)),hashes=[];for(let offset=0;offset<Math.max(1,bytes.length);offset+=CHUNK_BYTES){const part=bytes.slice(offset,offset+CHUNK_BYTES),hash=await hashBytes(part);hashes.push(hash);chunks.set(hash,part);}entries.push({key:record.key,kind:record.kind||'json',bytes:bytes.length,chunks:hashes});}return{manifest:validateManifest({version:1,entries}),chunks};}
export async function unpackEntries(manifest,getChunk){validateManifest(manifest);const result=[];for(const entry of manifest.entries){const bytes=new Uint8Array(entry.bytes);let offset=0;for(const hash of entry.chunks){const part=await getChunk(hash);if(await hashBytes(part)!==hash||offset+part.length>bytes.length)throw Error('Account download failed its integrity check. Local work was preserved.');bytes.set(part,offset);offset+=part.length;}if(offset!==bytes.length)throw Error('Incomplete account download.');result.push({key:entry.key,kind:entry.kind,value:entry.kind==='blob'?new Blob([bytes]):JSON.parse(new TextDecoder().decode(bytes))});}return result;}
