import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {volumeTemplates,briefs} from '../src/lib/templates/volume-two.js';
import {volumeRecipe} from '../src/lib/templates/volume-recipes.js';
import {generateRecipe,validateCuratedQuality} from '../src/lib/templates/curated-generate.js';
import photos from '../src/lib/creative/photo-library.json' with {type:'json'};
import metadata,{templateThumbnail} from '../src/lib/templates/library-metadata.js';
import {discoverTemplates} from '../src/lib/templates/discovery.js';
import {patchElement,history,commit,undo,redo,validateDocument} from '../src/lib/editor/document.js';
const assets=Object.fromEntries(photos.map(p=>[p.id,{src:'data:image/webp;base64,AAAA',width:1600,height:1200}]));
test('500 new editable designs fit every text frame and canvas with working previews',async()=>{
 assert.equal(volumeTemplates.length,500);assert.equal(briefs.length,25);assert.equal(new Set(metadata.templates.map(t=>t.id)).size,metadata.templates.length);
 const recipes=new Set();
 for(const t of volumeTemplates){const recipe=volumeRecipe(t.id),doc=generateRecipe(recipe,assets);recipes.add(JSON.stringify(recipe.commands));assert.deepEqual(validateCuratedQuality(doc),[],t.id);assert.deepEqual(validateDocument(doc),doc);await access(new URL('../public'+templateThumbnail(t),import.meta.url));const element=doc.elements.find(e=>e.type==='text');const h=commit(history(doc),patchElement(doc,element.id,{text:'My brand'}));assert.equal(undo(h).present.elements.find(e=>e.id===element.id).text,element.text);assert.equal(redo(undo(h)).present.elements.find(e=>e.id===element.id).text,'My brand');}
 assert.equal(recipes.size,500);assert.equal(discoverTemplates({query:'coffee'}).filter(t=>t.id.startsWith('collection-')).length,20);
});
test('60 locally stored stock photos have full-size images, small thumbnails and license metadata',async()=>{
 assert.equal(photos.length,60);assert.equal(new Set(photos.map(p=>p.path)).size,photos.length);
 for(const p of photos){const full=await sharp(await readFile(new URL('../public'+p.path,import.meta.url))).metadata(),thumb=await sharp(await readFile(new URL('../public'+p.thumbnail,import.meta.url))).metadata();assert.ok(Math.max(full.width,full.height)>=1600,p.name);assert.equal(thumb.width,400);assert.equal(thumb.height,400);assert.equal(p.license,'https://unsplash.com/license');}
});
test('account identity changes remain isolated and produce a recoverable session transition',async()=>{
 const scope=await import('../src/lib/cloud/account-scope.js?identity-regression');const A='00000000-0000-4000-8000-000000000001';scope.selectAccount(null);scope.selectAccount(null);assert.throws(()=>scope.selectAccount(A),e=>e.code==='account_changed');assert.equal(scope.accountOwner(),null);
});
