import {pageSnapshots,allElements} from '../editor/pages.js';
import {applyDesignTheme,designThemes} from '../editor/smart-create.js';
import {validateDocument} from '../editor/document.js';
export function applyCampaignStyle(doc,styleId){
 if(!designThemes.some(t=>t.id===styleId))throw Error('Choose a supported campaign style.');
 const base={...doc};delete base.pages;delete base.activePageId;delete base.pageVersion;base.schemaVersion=doc.schemaVersion===1?1:2;
 const pages=pageSnapshots(doc).map(p=>{const styled=applyDesignTheme({...base,canvas:p.canvas,elements:p.elements},styleId);return {...p,canvas:styled.canvas,elements:styled.elements};});
 if(!doc.pages)return validateDocument({...doc,canvas:pages[0].canvas,elements:pages[0].elements});
 const active=pages.find(p=>p.id===doc.activePageId);
 return validateDocument({...doc,pages,canvas:active.canvas,elements:active.elements});
}
export function campaignChangeSummary(current,next,records){
 const before=new Map(current.sharedFields.map(f=>[f.id,f]));
 const fields=next.sharedFields.filter(f=>JSON.stringify(before.get(f.id))!==JSON.stringify(f)).map(f=>({id:f.id,label:f.label,before:before.get(f.id)?.value??'',after:f.value,type:f.type}));
 for(const f of current.sharedFields)if(!next.sharedFields.some(n=>n.id===f.id))fields.push({id:f.id,label:f.label,before:f.value,after:'Removed',type:f.type});
 const changed=new Set(fields.map(f=>f.id));
 const designs=records.map(r=>{const elements=allElements(r.document).filter(e=>changed.has(e.binding?.fieldId)&&e.binding?.campaignId===current.id);return{id:r.id,name:r.document.name,updated:elements.filter(e=>!e.localOverride).length,overridden:elements.filter(e=>e.localOverride).length};});
 return{fields,designs};
}
