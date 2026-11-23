import {packEntries,unpackEntries,mergeManifests,emptyManifest,entrySignature} from './sync-model.js';
import {readAccountRecords,writeAccountRecords,saveSyncMeta,validateAccountRecords,guestRecords} from './local-account.js';
const signature=manifest=>JSON.stringify(manifest.entries.map(e=>[e.key,entrySignature(e)]).sort());
export function createSyncEngine({transport,read=readAccountRecords,write=writeAccountRecords,checkpoint=saveSyncMeta,onStatus=()=>{}}){
 let stopped=false,running=null;
 async function perform(resolution){
  onStatus({state:'saving',message:'Saving to your account…'});
  const local=await read(),packed=await packEntries(local.records),remote=await transport.head(),base=local.meta?.manifest||emptyManifest();
  const plan=mergeManifests(base,packed.manifest,remote.manifest,resolution);
  if(plan.conflicts.length&&!resolution){const status={state:'conflict',message:`${plan.conflicts.length} items changed on both devices. Choose which version to keep.`,conflicts:plan.conflicts,cached:!!local.meta};onStatus(status);return status;}
  if(stopped)return;
  const getChunk=async hash=>packed.chunks.get(hash)||transport.download(hash);
  const mergedRecords=await unpackEntries(plan.manifest,getChunk);validateAccountRecords(mergedRecords);
  let revision=remote.revision;
  if(signature(plan.manifest)!==signature(remote.manifest)){
   const known=new Set(remote.manifest.entries.flatMap(e=>e.chunks));
   for(const hash of new Set(plan.manifest.entries.flatMap(e=>e.chunks))){if(stopped)return;if(!known.has(hash))await transport.upload(hash,await getChunk(hash));}
   if(stopped)return;
   revision=await transport.commit(remote.revision,plan.manifest);
  }
  if(stopped)return;
  // Keep edits that finished saving on this device while the network request was in flight.
  const current=await read(),now=await packEntries(current.records),start=new Map(packed.manifest.entries.map(e=>[e.key,entrySignature(e)])),later=new Map(now.manifest.entries.map(e=>[e.key,entrySignature(e)])),finalRecords=new Map(mergedRecords.map(r=>[r.key,r])),latest=new Map(current.records.map(r=>[r.key,r]));
  for(const key of new Set([...start.keys(),...later.keys()]))if(start.get(key)!==later.get(key)){if(latest.has(key))finalRecords.set(key,latest.get(key));else finalRecords.delete(key);}
  const final=[...finalRecords.values()],finalPacked=await packEntries(final),meta={...current.meta,manifest:plan.manifest,revision,lastSaved:new Date().toISOString()};
  if(signature(finalPacked.manifest)!==signature(now.manifest))await write(final,meta,{expectedGeneration:current.generation,recovery:resolution?current.records:null});
  else await checkpoint(meta);
  const pending=signature(finalPacked.manifest)!==signature(plan.manifest),status={state:pending?'pending':'saved',message:pending?'New changes are waiting to save.':'Saved to your account',at:meta.lastSaved,cached:true};onStatus(status);return status;
 }
 return{stop(){stopped=true;},sync(resolution=null){if(running)return running;running=perform(resolution).catch(e=>{const state=e.code==='account_changed'||e.code==='signed_out'?'session':e.code==='revision_conflict'?'pending':'offline';const status={state,message:state==='session'?'Your session changed. Sign in again to continue.':state==='pending'?'Another device saved first. Retrying…':e.message||'Offline. Changes are saved on this device and will sync when you reconnect.'};onStatus(status);return status;}).finally(()=>{running=null;});return running;},async importGuest(){const current=await read(),guest=await guestRecords(),records=new Map(guest.map(r=>[r.key,r]));for(const r of current.records)records.set(r.key,r);await write([...records.values()],{...current.meta,guestImported:true},{expectedGeneration:current.generation,recovery:current.records});return this.sync();}};
}
export function httpSyncTransport(userId){
 async function request(path='',options={}){const response=await fetch('/api/account-sync'+path,{...options,signal:AbortSignal.timeout(30000),cache:'no-store',headers:{'X-Comvexa-Account':userId,...options.headers}});if(!response.ok){let body;try{body=await response.json();}catch{body={};}const error=Error(body.error||'Could not reach account saving. Your device copy is preserved.');error.code=body.code;throw error;}return response;}
 return{head:async()=> (await request()).json(),download:async hash=>new Uint8Array(await (await request('?chunk='+hash)).arrayBuffer()),upload:async(hash,bytes)=>request('?chunk='+hash,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:bytes}),commit:async(expectedRevision,manifest)=>(await (await request('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision,manifest})})).json()).revision};
}
