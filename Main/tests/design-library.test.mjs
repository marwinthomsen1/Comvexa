import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {designStore} from '../src/lib/editor/store.js';
import {newDesign,makeElement} from '../src/lib/editor/document.js';
import {renameDesign,duplicateDesign,setDesignTrashed,previewCache} from '../src/lib/editor/library.js';
import {openDesignDB} from '../src/lib/editor/database.js';
test('existing designs remain intact through library rename, duplicate, trash and restore',async()=>{
 const doc=newDesign('A birthday',1080,1350);doc.elements.push(makeElement('text','headline'));
 await designStore.save('library-original',doc,0);
 await renameDesign('library-original','Celebration');
 const renamed=await designStore.load('library-original');assert.equal(renamed.document.name,'Celebration');assert.equal(renamed.revision,2);
 await duplicateDesign('library-original','library-copy');const copy=await designStore.load('library-copy');assert.equal(copy.document.name,'Celebration copy');assert.deepEqual(copy.document.elements,doc.elements);
 await setDesignTrashed('library-original');assert.ok(!(await designStore.list()).some(d=>d.id==='library-original'));assert.ok((await designStore.list({includeTrash:true})).some(d=>d.id==='library-original'&&d.trashedAt));assert.equal((await designStore.load('library-original')).document.name,'Celebration');
 await setDesignTrashed('library-original',false);assert.ok((await designStore.list()).some(d=>d.id==='library-original'));
 await assert.rejects(()=>renameDesign('library-original','  '));assert.equal((await designStore.load('library-original')).revision,2);
});
test('thumbnail cache carries revision without mutating design revision or document',async()=>{
 const d=newDesign('Cache');await designStore.save('library-cache',d,0);
 const blob=new Blob(['preview'],{type:'image/png'});await previewCache.put({id:'library-cache',revision:1,blob});assert.equal((await previewCache.get('library-cache')).revision,1);
 await renameDesign('library-cache','Updated');assert.notEqual((await previewCache.get('library-cache')).revision,(await designStore.load('library-cache')).revision);
 const db=await openDesignDB();assert.equal(db.version,6);assert.ok(db.objectStoreNames.contains("revisions"));assert.ok(db.objectStoreNames.contains("reviews"));assert.ok(db.objectStoreNames.contains('designs'));assert.ok(db.objectStoreNames.contains('packages'));db.close();
});
test('v2 database upgrade preserves saved designs and campaigns',async()=>{
 const {IDBFactory}=await import('fake-indexeddb');const previous=globalThis.indexedDB;globalThis.indexedDB=new IDBFactory();
 try{await new Promise((resolve,reject)=>{const r=indexedDB.open('comvexa-designs-v1',2);r.onupgradeneeded=()=>{r.result.createObjectStore('designs',{keyPath:'id'}).put({id:'old-design',document:newDesign('Before upgrade'),revision:7,updatedAt:'2026-01-01T00:00:00.000Z'});r.result.createObjectStore('packages',{keyPath:'id'}).put({id:'old-campaign',name:'Preserve me',createdAt:'2026-01-01T00:00:00.000Z'});};r.onsuccess=()=>{r.result.close();resolve();};r.onerror=()=>reject(r.error);});
 const db=await openDesignDB();assert.ok(db.objectStoreNames.contains('thumbnails'));db.close();assert.equal((await designStore.load('old-design')).revision,7);assert.equal((await designStore.listPackages())[0].name,'Preserve me');
 }finally{globalThis.indexedDB=previous;}
});
