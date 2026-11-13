import test from 'node:test';
import assert from 'node:assert/strict';
import {textDesigns,insertTextDesign} from '../src/lib/typography/designs.js';
import {newDesign,validateDocument,history,commit,undo,redo} from '../src/lib/editor/document.js';
test('text compositions insert editable text and grouped decorations as one history action',()=>{
 let serial=0;for(const design of textDesigns){const initial=newDesign();const result=insertTextDesign(initial,design.id,()=>`text-design-${++serial}`);assert.deepEqual(validateDocument(result.document),result.document);assert.equal(initial.elements.length,0);assert.ok(result.document.elements.some(e=>e.type==='text'));assert.equal(Object.keys(result.document.assets).length,0);const h=commit(history(initial),result.document);assert.deepEqual(undo(h).present,initial);assert.deepEqual(redo(undo(h)).present,result.document);assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(result.document))),result.document);}
});
