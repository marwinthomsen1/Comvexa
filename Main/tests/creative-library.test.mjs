// Focused regression coverage for Stage D. Not executed during fast development.
import test from 'node:test';
import assert from 'node:assert/strict';
import {photoFilters,photoEffects} from '../src/lib/creative/photos.js';
import {photoFrames,validatePhotoFrame} from '../src/lib/creative/frames.js';
import {stickers,stickerSVG} from '../src/lib/creative/stickers.js';
import {adjustPhotoPixels,validatePhotoStyle} from '../src/lib/editor/photo-style.js';
import {newDesign,makeElement,patchElement,validateDocument} from '../src/lib/editor/document.js';
test('creative catalogs retain distinct IDs and original sticker illustrations',()=>{
 assert.equal(photoFilters.length,42);assert.equal(photoEffects.length,32);assert.equal(photoFrames.length,50);assert.equal(stickers.length,200);
 for(const collection of [photoFilters,photoEffects,photoFrames,stickers])assert.equal(new Set(collection.map(i=>i.id)).size,collection.length);
 assert.equal(new Set(stickers.map(s=>stickerSVG(s.id))).size,200);
 for(const s of stickers){const svg=stickerSVG(s.id);assert.ok(svg.startsWith('<svg'));assert.ok(!/<script|<foreignObject|https?:\/\/(?!www.w3.org)/.test(svg));}
});
test('all filters process pixels deterministically, preserve alpha and obey zero intensity',()=>{
 const original=new Uint8ClampedArray([20,60,110,150,210,160,90,255]);
 for(const f of photoFilters){const style={filter:f.id,filterIntensity:100};assert.deepEqual(adjustPhotoPixels(original.slice(),style),adjustPhotoPixels(original.slice(),style));assert.equal(adjustPhotoPixels(original.slice(),style)[3],150);assert.deepEqual(adjustPhotoPixels(original.slice(),{...style,filterIntensity:0}),original);}
 assert.throws(()=>validatePhotoStyle({filter:'untrusted'}));assert.throws(()=>validatePhotoStyle({effectIntensity:101}));assert.throws(()=>validatePhotoStyle({blur:-2}));
});
test('photo frames and creative settings validate and roundtrip without altering source assets',()=>{
 const asset={src:'data:image/png;base64,AAAA',width:100,height:100};let doc={...newDesign(),assets:{photo:asset},elements:[{...makeElement('image','one'),assetId:'photo',crop:{x:0,y:0,width:1,height:1}}]};
 for(const f of photoFrames){const frame=validatePhotoFrame({id:f.id,color:'#a755ee',border:2});doc=patchElement(doc,'one',{photoFrame:frame,photoStyle:{filter:photoFilters[0].id,effect:photoEffects[0].id,exposure:12,blur:8}});assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))),doc);assert.equal(doc.assets.photo.src,asset.src);}
 doc=patchElement(doc,'one',{photoFrame:null});assert.equal(doc.elements[0].photoFrame,undefined);assert.throws(()=>validatePhotoFrame({id:'arbitrary-svg',color:'#ffffff',border:2}));
});
