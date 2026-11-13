import {validateDocument,MAX_BYTES} from './document.js';
export const MAX_PAGES=20;
const check=(ok,message)=>{if(!ok)throw Error(message);};
const baseDocument=doc=>{const base={...doc};delete base.pages;delete base.activePageId;delete base.pageVersion;return{...base,schemaVersion:doc.schemaVersion===1?1:2};};
export function pageSnapshots(doc){return doc.pages?doc.pages.map(p=>p.id===doc.activePageId?{...p,canvas:doc.canvas,elements:doc.elements}:p):[{id:'page-1',name:'Page 1',canvas:doc.canvas,elements:doc.elements}];}
export function allElements(doc){return pageSnapshots(doc).flatMap(p=>p.elements);}
export function pageDocument(doc,page){return validateDocument({...baseDocument(doc),canvas:page.canvas,elements:page.elements});}
export function pageDocuments(doc){return pageSnapshots(doc).map(p=>pageDocument(doc,p));}
export function validatePagedDocument(value){
 check([2,3].includes(value.schemaVersion)&&value.pageVersion===1&&Array.isArray(value.pages)&&value.pages.length>=1&&value.pages.length<=MAX_PAGES,'Use 1–20 pages in a supported project.');
 check(value.pages.some(p=>p?.id===value.activePageId),'Active page is missing.');
 const base=baseDocument(value),pageIds=new Set(),ids=new Set(),groupIds=new Set(),assets={},pages=[];
 for(const p of pageSnapshots(value)){
  check(p&&typeof p.id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(p.id)&&!pageIds.has(p.id),'Page IDs must be unique.');pageIds.add(p.id);
  check(typeof p.name==='string'&&p.name.trim()&&p.name.length<=80,'Page names must be 1–80 characters.');
  const checked=validateDocument({...base,canvas:p.canvas,elements:p.elements});
  for(const e of checked.elements){check(!ids.has(e.id),'Element IDs must be unique across pages.');ids.add(e.id);}
  for(const group of new Set(checked.elements.map(e=>e.groupId).filter(Boolean))){check(!groupIds.has(group),"Group IDs must be unique across pages.");groupIds.add(group);}
  Object.assign(assets,checked.assets);pages.push({id:p.id,name:p.name.trim(),canvas:checked.canvas,elements:checked.elements});
 }
 for(const group of groupIds)check(!ids.has(group),'Group and element IDs must differ across pages.');
 check(ids.size<=500,'Use at most 500 elements across pages.');
 const active=pages.find(p=>p.id===value.activePageId),checked=validateDocument({...base,canvas:active.canvas,elements:active.elements});
 const result={...checked,schemaVersion:3,pageVersion:1,activePageId:value.activePageId,pages,assets};
 check(new TextEncoder().encode(JSON.stringify(result)).byteLength<=MAX_BYTES,'Project exceeds the 20 MB limit.');return result;
}
export function ensurePages(doc){if(doc.pages)return validateDocument(doc);return validateDocument({...doc,schemaVersion:3,pageVersion:1,activePageId:'page-1',pages:pageSnapshots(doc)});}
export function switchPage(doc,id){const next=ensurePages(doc),p=next.pages.find(p=>p.id===id);check(p,'Page not found.');return validateDocument({...next,activePageId:id,canvas:p.canvas,elements:p.elements});}
export function mapAllElements(doc,fn){if(!doc.pages)return{...doc,elements:doc.elements.map(fn)};const pages=pageSnapshots(doc).map(p=>({...p,elements:p.elements.map(fn)}));return{...doc,pages,elements:pages.find(p=>p.id===doc.activePageId).elements};}
export function addPage(doc,id,{duplicate=false,name}={},idFactory=()=>crypto.randomUUID()){
 const next=ensurePages(doc);check(next.pages.length<MAX_PAGES,'This project already has 20 pages.');
 const groups=new Map(),elements=duplicate?next.elements.map(e=>{if(e.groupId&&!groups.has(e.groupId))groups.set(e.groupId,idFactory());return{...e,id:idFactory(),...(e.groupId?{groupId:groups.get(e.groupId)}:{})};}):[];
 const p={id,name:name||`Page ${next.pages.length+1}`,canvas:{...next.canvas},elements};return switchPage({...next,pages:[...next.pages,p]},id);
}
export function removePage(doc,id){const next=ensurePages(doc);check(next.pages.length>1,'Keep at least one page.');const pages=next.pages.filter(p=>p.id!==id),active=pages.find(p=>p.id===next.activePageId)||pages[0];return validateDocument({...next,pages,activePageId:active.id,canvas:active.canvas,elements:active.elements});}
export function renamePage(doc,id,name){const next=ensurePages(doc);return validateDocument({...next,pages:next.pages.map(p=>p.id===id?{...p,name}:p)});}
export function reorderPage(doc,id,target){const next=ensurePages(doc),pages=[...next.pages],from=pages.findIndex(p=>p.id===id),to=pages.findIndex(p=>p.id===target);check(from>=0&&to>=0,'Page not found.');pages.splice(to,0,pages.splice(from,1)[0]);return validateDocument({...next,pages});}
