import {openDesignDB} from './database.js';
import {validateDocument} from './document.js';
import {normalizeCampaign,resolveDocument} from '../connected/model.js';
import {allElements,mapAllElements} from './pages.js';
import {validateReview} from './reviews.js';
import {mediaRecord} from '../video/media-store.js';
import {announceChange} from '../connected/store.js';
export const MAX_LIBRARY_BACKUP=100*1024*1024;
const idOK=id=>typeof id==='string'&&/^[a-zA-Z0-9.-]{1,80}$/.test(id);
export function validateLibraryBackup(input){
 if(!input||input.kind!=='comvexa-library-backup'||input.version!==1||!Array.isArray(input.designs)||input.designs.length>200||!Array.isArray(input.campaigns)||input.campaigns.length>100||!Array.isArray(input.reviews)||input.reviews.length>200)throw Error('Choose a supported Comvexa library backup (up to 200 designs).');
 if(new TextEncoder().encode(JSON.stringify(input)).byteLength>MAX_LIBRARY_BACKUP)throw Error('Library backup exceeds 100 MB.');
 const ids=new Set(),campaignIds=new Set();
 const designs=input.designs.map(r=>{if(!idOK(r.id)||ids.has(r.id))throw Error('Backup has invalid or duplicate design identifiers.');ids.add(r.id);const document=validateDocument(r.document);return{id:r.id,document,trashedAt:typeof r.trashedAt==='string'?r.trashedAt:null};});
 const campaigns=input.campaigns.map(c=>{if(!idOK(c.id)||campaignIds.has(c.id))throw Error('Backup has duplicate campaign identifiers.');campaignIds.add(c.id);return normalizeCampaign(c,designs.filter(r=>r.document.provenance?.campaignId===c.id||allElements(r.document).some(e=>e.binding?.campaignId===c.id)).map(r=>r.document));});
 for(const r of designs){for(const e of allElements(r.document))if(e.binding&&!campaignIds.has(e.binding.campaignId))throw Error('Backup is missing a connected campaign.');resolveDocument(r.document,campaigns);}
 const reviewIds=new Set();const reviews=input.reviews.map(r=>{const value=validateReview(r);if(!ids.has(value.id)||reviewIds.has(value.id))throw Error('Backup contains an invalid review reference.');reviewIds.add(value.id);return value;});
 const required=new Map();for(const r of designs)for(const [id,metadata] of Object.entries(r.document.video?.media||{})){if(required.has(id)&&JSON.stringify(required.get(id))!==JSON.stringify(metadata))throw Error('Backup has conflicting media metadata.');required.set(id,metadata);}
 const media=input.media||[];if(!Array.isArray(media)||media.length>200||media.length!==required.size)throw Error('Backup is missing original video or audio files.');
 const mediaIds=new Set();const checkedMedia=media.map(m=>{const metadata=required.get(m?.id);if(!metadata||mediaIds.has(m.id)||typeof m.base64!=='string'||!/^[A-Za-z0-9+/]+=*$/.test(m.base64)||m.base64.length%4||m.base64.length>70*1024*1024)throw Error('Invalid original media source.');mediaIds.add(m.id);const length=m.base64.length/4*3-(m.base64.endsWith('==')?2:m.base64.endsWith('=')?1:0);if(length!==metadata.bytes)throw Error('Backup contains incomplete media: '+metadata.name);return{id:m.id,base64:m.base64};});
 return{kind:input.kind,version:1,designs,campaigns,reviews,media:checkedMedia};
}
function encodeBytes(bytes){let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);}
function decodeBytes(base64){const text=atob(base64),bytes=new Uint8Array(text.length);for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i);return bytes;}
export async function exportLibrary(){const db=await openDesignDB();let data;try{data=await new Promise((resolve,reject)=>{const t=db.transaction(['designs','packages','reviews']),data={kind:'comvexa-library-backup',version:1,createdAt:new Date().toISOString()};for(const [store,key] of [['designs','designs'],['packages','campaigns'],['reviews','reviews']]){const r=t.objectStore(store).getAll();r.onsuccess=()=>data[key]=r.result;}t.oncomplete=()=>resolve(data);t.onerror=t.onabort=()=>reject(Error('Could not read the design library.'));});}finally{db.close();}
 data.media=[];let total=new TextEncoder().encode(JSON.stringify(data)).byteLength;
 for(const id of new Set(data.designs.flatMap(r=>Object.keys(r.document.video?.media||{})))){const source=await mediaRecord(id);if(!source?.blob)throw Error('A video/audio source is missing. Open that project and re-upload its original media before backing up.');total+=Math.ceil(source.blob.size/3)*4;if(total>MAX_LIBRARY_BACKUP)throw Error('Library exceeds 100 MB. Download individual video ZIP backups and individual project files instead.');data.media.push({id,base64:encodeBytes(new Uint8Array(await source.blob.arrayBuffer()))});}
 return validateLibraryBackup(data);
}
export function copyLibraryBackup(input,idFactory=()=>crypto.randomUUID()){
 const data=validateLibraryBackup(input),designIds=new Map(data.designs.map(r=>[r.id,idFactory()])),campaignIds=new Map(data.campaigns.map(c=>[c.id,idFactory()])),mediaIds=new Map(data.media.map(m=>[m.id,idFactory()]));
 const now=new Date().toISOString();
 const designs=data.designs.map(r=>{let doc=mapAllElements(r.document,e=>e.binding?{...e,binding:{...e.binding,campaignId:campaignIds.get(e.binding.campaignId)}}:e);if(doc.video)doc={...doc,video:{...doc.video,media:Object.fromEntries(Object.entries(doc.video.media).map(([id,m])=>[mediaIds.get(id),m])),clips:doc.video.clips.map(c=>({...c,mediaId:mediaIds.get(c.mediaId)})),audio:doc.video.audio.map(c=>({...c,mediaId:mediaIds.get(c.mediaId)}))}};doc={...doc,name:(doc.name+' restored').slice(0,80),...(doc.provenance?{provenance:{...doc.provenance,...(campaignIds.has(doc.provenance.campaignId)?{campaignId:campaignIds.get(doc.provenance.campaignId)}:{})}}:{})};return{id:designIds.get(r.id),document:validateDocument(doc),revision:1,updatedAt:now,trashedAt:r.trashedAt};});
 const campaigns=data.campaigns.map(c=>normalizeCampaign({...c,id:campaignIds.get(c.id),name:(c.name+' restored').slice(0,160),designIds:designs.filter(r=>r.document.provenance?.campaignId===campaignIds.get(c.id)||allElements(r.document).some(e=>e.binding?.campaignId===campaignIds.get(c.id))).map(r=>r.id),revision:1,createdAt:now,updatedAt:now}));
 // Retain discussions as historical context; copied artwork starts a new review.
 const reviews=data.reviews.map(r=>({...r,id:designIds.get(r.id),revision:1,status:'draft',version:1,comments:r.comments.map(c=>({...c,revision:1,text:`[Restored from revision ${c.revision}] ${c.text}`.slice(0,2000)}))}));
 const metadata=new Map(designs.flatMap(r=>Object.entries(r.document.video?.media||{})));
 const media=data.media.map(m=>({id:mediaIds.get(m.id),blob:new Blob([decodeBytes(m.base64)],{type:metadata.get(mediaIds.get(m.id)).mime}),metadata:metadata.get(mediaIds.get(m.id)),createdAt:now}));
 return{designs,campaigns,reviews,media};
}
export async function restoreLibrary(input){const data=copyLibraryBackup(input),db=await openDesignDB();try{await new Promise((resolve,reject)=>{const t=db.transaction(['designs','packages','reviews','media-backups'],'readwrite');t.oncomplete=resolve;t.onerror=t.onabort=()=>reject(Error('Restore failed. No partial copy was saved. Your existing library is unchanged.'));try{for(const [store,key] of [['designs','designs'],['packages','campaigns'],['reviews','reviews'],['media-backups','media']])for(const record of data[key])t.objectStore(store).add(record);}catch{t.abort();}});announceChange();return data.designs.length;}finally{db.close();}}
