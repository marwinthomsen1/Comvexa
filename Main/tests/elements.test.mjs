import test from "node:test";
import assert from "node:assert/strict";
import Konva from "konva";
import "fake-indexeddb/auto";
import {elementLibrary,filterElements} from "../src/lib/elements/catalog.js";
import {graphicBounds} from "../src/lib/elements/bounds.js";
import {graphicPathAttributes} from "../src/lib/elements/render.js";
import {insertLibraryElement} from "../src/lib/elements/insert.js";
import {newDesign,validateDocument,patchElement,history,commit,undo,redo} from "../src/lib/editor/document.js";
import {groupSelection,transformSelection,ungroupSelection} from "../src/lib/editor/selection.js";
import {clipboardPayload,pasteSelection} from "../src/lib/editor/clipboard.js";
import {designStore} from "../src/lib/editor/store.js";

test("79 discoverable original elements have unique IDs and distinct vector paths",()=>{
 assert.equal(elementLibrary.length,79);
 assert.equal(new Set(elementLibrary.map(e=>e.id)).size,79);
 const paths=elementLibrary.filter(e=>e.path);
 assert.equal(new Set(paths.map(e=>e.path)).size,paths.length);
 assert.ok(filterElements("heart").some(e=>e.id==="heart"));
 assert.equal(filterElements("heart","Arrows").length,0);
 assert.equal(filterElements("no-such-graphic").length,0);
 assert.equal(filterElements("","Arrows").length,10);
});
test("all elements insert centered at safe sizes, validate and retain editable styles",()=>{
 for(const item of elementLibrary) for(const size of [64,1080]) {
  const doc=insertLibraryElement(newDesign("Test",size,size),item.id,"element-one","#aabbcc");
  assert.deepEqual(validateDocument(doc),doc);
  const e=doc.elements[0];
  assert.ok(e.x>=0 && e.y>=0 && e.x+e.width<=size && e.y+e.height<=size,item.id);
  assert.equal(e.fill,"#aabbcc");
  const changed=patchElement(doc,e.id,{fill:"#ff3300",stroke:"#111111",strokeWidth:3,rotation:45});
  assert.equal(changed.elements[0].graphicKind,item.path?item.id:undefined);
  if(item.path) assert.equal(doc.schemaVersion,2);
 }
 assert.throws(()=>insertLibraryElement(newDesign(),"untrusted","one"));
});
test("vector renderer normalizes actual Konva path bounds to the exact document frame",()=>{
 for(const item of elementLibrary.filter(e=>e.path)) {
  const path=new Konva.Path({data:item.path});
  assert.deepEqual(path.getSelfRect(),graphicBounds[item.id],item.id);
  path.destroy();
  const e=insertLibraryElement(newDesign(),item.id,"one").elements[0];
  const rendered=new Konva.Path(graphicPathAttributes(e));
  const bounds=rendered.getClientRect();
  for(const [key,value] of Object.entries({x:0,y:0,width:e.width,height:e.height})) assert.ok(Math.abs(bounds[key]-value)<1e-6,`${item.id} ${key}`);
  rendered.destroy();
 }
});
test("graphics save/reopen, copy between designs, and preserve group transforms/history",async()=>{
 for(const item of elementLibrary.filter(e=>e.path)) {
  let doc=insertLibraryElement(newDesign(),item.id,"graphic");
  doc=insertLibraryElement(doc,"circle","circle");
  doc=groupSelection(doc,["graphic","circle"],"group-one");
  const transformed=transformSelection(doc,["graphic","circle"],{dx:18,dy:27,scale:1.3,rotation:30});
  const h=commit(history(doc),transformed);
  assert.deepEqual(undo(h).present,doc);
  assert.deepEqual(redo(undo(h)).present,transformed);
  const id=`element-test-${item.id}`;
  await designStore.save(id,transformed,0);
  assert.deepEqual((await designStore.loadConnected(id)).document,transformed);
  let seq=0;
  const pasted=pasteSelection(newDesign(),clipboardPayload(transformed,["graphic"]),()=>`copy-${++seq}`);
  assert.equal(pasted.document.elements.length,2);
  assert.equal(pasted.document.elements[0].graphicKind,item.id);
  assert.equal(ungroupSelection(pasted.document,pasted.ids).elements[0].groupId,undefined);
 }
});
test("graphic import rejects arbitrary presets, incompatible versions and non-shape targets",()=>{
 const doc=insertLibraryElement(newDesign(),"heart","one");
 for(const kind of ["<svg onload=evil()>","https://example.com/x.svg","toString",{},null]) {
  const invalid=structuredClone(doc);invalid.elements[0].graphicKind=kind;assert.throws(()=>validateDocument(invalid));
 }
 const v1={...doc,schemaVersion:1};assert.throws(()=>validateDocument(v1));
 const ellipse=structuredClone(doc);ellipse.elements[0].type="ellipse";assert.throws(()=>validateDocument(ellipse));
 // Ordinary old v1 documents remain unchanged.
 const old=insertLibraryElement(newDesign(),"rectangle","one");assert.equal(old.schemaVersion,1);assert.deepEqual(validateDocument(old),old);
});

test("adding a vector to an existing v1 project preserves a pre-upgrade backup",async()=>{
 const old=insertLibraryElement(newDesign(),"rectangle","old-element");
 await designStore.save("graphic-upgrade-backup",old,0);
 const next=insertLibraryElement(old,"heart","new-graphic");
 await designStore.save("graphic-upgrade-backup",next,1);
 const record=await designStore.load("graphic-upgrade-backup");
 assert.ok(record.legacyV1Backup);
 assert.deepEqual(record.document,next);
 assert.equal(record.legacyV1Backup.document.schemaVersion,1);
 assert.equal(record.legacyV1Backup.document.elements.length,1);
});
