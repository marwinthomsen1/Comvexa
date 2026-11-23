import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {IDBObjectStore} from 'fake-indexeddb';
import {newDesign,makeElement,addElement,patchElement} from '../src/lib/editor/document.js';
import {designStore} from '../src/lib/editor/store.js';
import {openDesignDB} from '../src/lib/editor/database.js';
import {listRevisions} from '../src/lib/editor/revisions.js';
import {loadReview,saveReview} from '../src/lib/editor/reviews.js';
import {designQuality,contrastRatio} from '../src/lib/editor/quality.js';
import {exportLibrary,validateLibraryBackup,restoreLibrary,copyLibraryBackup} from '../src/lib/editor/library-backup.js';
import {addPage,pageSnapshots,allElements} from '../src/lib/editor/pages.js';
import {applyCampaignStyle,campaignChangeSummary} from '../src/lib/connected/summary.js';
import {generatePackage} from '../src/lib/templates/generate.js';
import {getFamily} from '../src/lib/templates/catalog.js';
import {readFile} from 'node:fs/promises';
function textDoc(name='Reliability'){return addElement(newDesign(name),{...makeElement('text','headline'),text:'Read me',fill:'#000000',x:80,y:80});}
test('version history archives prior saves, retains ten, restores independently and rejects stale writes',async()=>{
 const id='history-design',original=textDoc();await designStore.save(id,original,0);
 for(let n=1;n<=12;n++)await designStore.save(id,{...original,name:`Revision ${n+1}`},n);
 const rows=await listRevisions(id);assert.equal(rows.length,10);assert.equal(rows[0].revision,12);assert.equal(rows.at(-1).revision,3);
 await assert.rejects(designStore.save(id,original,1));assert.equal((await listRevisions(id)).length,10);
 await designStore.importConnected('history-restored',rows[0].portable,0);assert.equal((await designStore.load('history-restored')).document.name,'Revision 12');assert.equal((await designStore.load(id)).revision,13);
});
test('history and document saves roll back together on a storage failure',async()=>{
 const id='history-quota',doc=textDoc();await designStore.save(id,doc,0);const put=IDBObjectStore.prototype.put;
 IDBObjectStore.prototype.put=function(...args){if(this.name==='revisions')throw new DOMException('Full','QuotaExceededError');return put.apply(this,args);};
 try{await assert.rejects(designStore.save(id,{...doc,name:'Should not save'},1));}finally{IDBObjectStore.prototype.put=put;}
 assert.equal((await designStore.load(id)).revision,1);assert.deepEqual(await listRevisions(id),[]);
});
test('quality checks inspect every page, rotation, crop resolution, print margins and solid background contrast',()=>{
 assert.equal(contrastRatio('#000000','#ffffff'),21);assert.equal(contrastRatio('#ffffff','#ffffff'),1);
 const doc=textDoc();let next=patchElement(doc,'headline',{fill:'#ffffff',x:1,width:30,height:10,text:'This will overflow'});next=addPage(next,'second');next=addElement(next,{...makeElement('text','second-text'),fill:'#000000',x:1000,y:40,rotation:30});
 let issues=designQuality(next,{print:true});assert(issues.some(i=>i.page===1&&i.code==='contrast'));assert(issues.some(i=>i.page===1&&i.code==='overflow'));assert(issues.some(i=>i.page===1&&i.code==='print-margin'));assert(issues.some(i=>i.page===2&&i.code==='outside'));
 const photo={...makeElement('image','photo'),assetId:'asset',x:0,y:0,width:1000,height:1000,crop:{x:0,y:0,width:.5,height:.5}};
 next={...doc,elements:[photo],assets:{asset:{width:500,height:500,src:'data:image/png;base64,AAAA'}}};assert(designQuality(next).some(i=>i.code==='resolution'));assert(!designQuality({...next,elements:[{...photo,hidden:true}]}).length);
 const shape={...makeElement('rect','background'),x:0,y:0,width:1080,height:1080,fill:'#000000'};
 assert(!designQuality({...doc,elements:[shape,{...doc.elements[0],fill:'#ffffff'}]}).some(i=>i.code==='contrast'));
 assert(!designQuality({...doc,canvas:{...doc.canvas,transparent:true},elements:[{...doc.elements[0],fill:'#ffffff'}]}).some(i=>i.code==='contrast'));
});
test('campaign styles cover all pages and preserve geometry, locked layers, bindings and text overrides',()=>{
 let doc=textDoc();doc=patchElement(doc,'headline',{locked:true});doc=addPage(doc,'second');doc=addElement(doc,{...makeElement('text','other'),text:'Local offer',binding:{campaignId:'campaign',fieldId:'name',transform:'plain'},localOverride:true});
 const next=applyCampaignStyle(doc,'electric');assert.equal(pageSnapshots(next).length,2);assert.equal(pageSnapshots(next)[0].elements[0].fill,'#000000');assert.equal(next.elements[0].fontFamily,'Montserrat');assert.equal(next.elements[0].text,'Local offer');assert.equal(next.elements[0].localOverride,true);assert.deepEqual(next.elements[0].binding,doc.elements[0].binding);for(let i=0;i<2;i++)for(const key of ['x','y','width','height','rotation'])assert.equal(allElements(next)[i][key],allElements(doc)[i][key]);assert.throws(()=>applyCampaignStyle(doc,'unknown'));
 const campaign={id:'campaign',sharedFields:[{id:'name',label:'Name',type:'text',value:'Before'}]};const summary=campaignChangeSummary(campaign,{...campaign,sharedFields:[{...campaign.sharedFields[0],value:'After'}]},[{id:'design',document:doc}]);assert.equal(summary.designs[0].overridden,1);assert.equal(summary.designs[0].updated,0);
});
test('local review uses optimistic concurrency and approvals are tied to an exact design revision',async()=>{
 const id='review-design',doc=textDoc();await designStore.save(id,doc,0);const first=await saveReview({id,revision:1,status:'approved',comments:[]},0);assert.equal(first.version,1);await assert.rejects(saveReview({...first,status:'draft'},0));await designStore.save(id,{...doc,name:'Changed after approval'},1);assert.equal((await loadReview(id)).revision,1);await assert.rejects(saveReview(first,1));const second=await saveReview({...first,revision:2,status:'draft',comments:[{id:'comment',author:'Reviewer',text:'Please update',resolved:false,revision:2,createdAt:new Date().toISOString()}]},1);assert.equal(second.version,2);await assert.rejects(saveReview({...second,comments:[{...second.comments[0],text:''}]},2));
});
test('library backup restores connected campaigns as independent copies, preserves originals, and imports atomically',async()=>{
 const f=getFamily('food'),bytes=await readFile(new URL('../public/images/previews/food.webp',import.meta.url));const bundle=generatePackage({campaignId:'backup-campaign',fields:{...f.sample,styleId:f.id,background:f.background,ink:f.ink,accent:f.accent},asset:{src:`data:image/webp;base64,${bytes.toString('base64')}`,width:960,height:960},assetId:'backup-photo',idFactory:(()=>{let n=0;return()=>`backup-design-${++n}`;})()});await designStore.savePackage(bundle);
 const backup=await exportLibrary(),copies=copyLibraryBackup(backup);assert.equal(copies.designs.length,backup.designs.length);const restoredCampaign=copies.campaigns.find(c=>c.name===bundle.campaign.name+' restored');assert.notEqual(restoredCampaign.id,'backup-campaign');for(const id of restoredCampaign.designIds){const r=copies.designs.find(d=>d.id===id);assert(r);assert(allElements(r.document).filter(e=>e.binding).every(e=>e.binding.campaignId===restoredCampaign.id));}
 const oldCount=(await designStore.list({includeTrash:true})).length;assert.equal(await restoreLibrary(backup),backup.designs.length);assert.equal((await designStore.list({includeTrash:true})).length,oldCount+backup.designs.length);assert.equal((await designStore.campaignSnapshot('backup-campaign')).records.length,4);
 const invalid=structuredClone(backup);invalid.designs.push(invalid.designs[0]);assert.throws(()=>validateLibraryBackup(invalid));await assert.rejects(restoreLibrary(invalid));
 const before=(await designStore.list({includeTrash:true})).length,add=IDBObjectStore.prototype.add;let count=0;IDBObjectStore.prototype.add=function(...args){if(this.name==='designs'&&++count===2)throw new DOMException('Full','QuotaExceededError');return add.apply(this,args);};
 try{await assert.rejects(restoreLibrary(backup));}finally{IDBObjectStore.prototype.add=add;}
 assert.equal((await designStore.list({includeTrash:true})).length,before);
 const db=await openDesignDB();assert.equal(db.version,6);db.close();
});
test('campaign-wide text and styles save together with recoverable prior revisions',async()=>{
 const snapshot=await designStore.campaignSnapshot('backup-campaign');const next={...snapshot.campaign,sharedFields:snapshot.campaign.sharedFields.map(f=>f.id==='name'?{...f,value:'A new campaign title'}:f)};
 const result=await designStore.updateCampaign(snapshot.campaign.id,next,snapshot.campaign.revision,{styleId:'editorial',expectedDesignRevisions:Object.fromEntries(snapshot.records.map(r=>[r.id,r.revision]))});
 for(const r of result.records){const before=snapshot.records.find(old=>old.id===r.id);assert.equal(r.revision,before.revision+1);assert.equal(r.document.canvas.background,'#f5f0e6');assert(allElements(r.document).some(e=>e.binding?.fieldId==='name'&&e.text.includes('A new campaign title')));const versions=await listRevisions(r.id);assert.equal(versions[0].revision,before.revision);assert.deepEqual(versions[0].portable.document,before.document);}
 const current=await designStore.campaignSnapshot('backup-campaign');await assert.rejects(designStore.updateCampaign(current.campaign.id,current.campaign,current.campaign.revision,{styleId:'invalid-style'}));assert.equal((await designStore.campaignSnapshot('backup-campaign')).campaign.revision,current.campaign.revision);
});
test('library backup includes original audio/video bytes and restores media with designs atomically',async()=>{
 const {persistMedia,mediaRecord}=await import('../src/lib/video/media-store.js');const {blankVideo,newClip}=await import('../src/lib/video/document.js');
 const source=new Blob([new Uint8Array([1,2,3,4])],{type:'audio/wav'}),metadata={kind:'audio',name:'test.wav',mime:'audio/wav',duration:5,bytes:4};await persistMedia('original-audio',source,metadata);
 const video={...blankVideo(5),media:{'original-audio':metadata},audio:[newClip('original-audio',metadata,0,5,()=> 'audio-clip')]};await designStore.save('media-design',{...newDesign('Media recovery'),video},0);
 const backup=await exportLibrary();assert.equal(backup.media.find(m=>m.id==='original-audio').base64,'AQIDBA==');
 const missing=structuredClone(backup);missing.media=[];assert.throws(()=>validateLibraryBackup(missing),/missing/);const truncated=structuredClone(backup);truncated.media[0].base64='AQID';assert.throws(()=>validateLibraryBackup(truncated),/incomplete/);
 await restoreLibrary(backup);const copy=(await designStore.list()).find(d=>d.name==='Media recovery restored'),record=await designStore.load(copy.id),sourceId=record.document.video.audio[0].mediaId;assert.notEqual(sourceId,'original-audio');const restored=await mediaRecord(sourceId);assert.deepEqual(new Uint8Array(await restored.blob.arrayBuffer()),new Uint8Array([1,2,3,4]));
 const before=(await designStore.list({includeTrash:true})).length,add=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){if(this.name==='media-backups')throw new DOMException('Full','QuotaExceededError');return add.apply(this,args);};try{await assert.rejects(restoreLibrary(backup));}finally{IDBObjectStore.prototype.add=add;}assert.equal((await designStore.list({includeTrash:true})).length,before);
});
