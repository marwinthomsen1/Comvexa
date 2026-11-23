import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import "fake-indexeddb/auto";
import {FONT_NAMES,fontCollection,searchFonts,ensureFont} from "../src/lib/typography/fonts.js";
import {validateTextStyle,effectStyle,textStyleAttributes,scaleTextStyle} from "../src/lib/typography/style.js";
import {textPresets,presetPatch} from "../src/lib/typography/presets.js";
import {newDesign,makeElement,patchElement,addElement,validateDocument,history,commit,undo,redo} from "../src/lib/editor/document.js";
import {designStore} from "../src/lib/editor/store.js";
import {groupSelection,transformSelection} from "../src/lib/editor/selection.js";
import {clipboardPayload,pasteSelection} from "../src/lib/editor/clipboard.js";
import {finalTransformPatches} from "../src/lib/editor/transform-session.js";
import {normalizeCampaign,resolveDocument} from "../src/lib/connected/model.js";
function textDoc(){return addElement(newDesign(),makeElement("text","text-one"));}
test("54 fonts are searchable and all 84 local faces have intact files and included OFL licenses",async()=>{
 assert.equal(FONT_NAMES.length,54);assert.equal(new Set(FONT_NAMES).size,54);assert.equal(fontCollection.length,50);
 assert.ok(searchFonts("playfair","Serif").some(f=>f.name==="Playfair Display"));assert.equal(searchFonts("playfair","Script").length,0);
 let count=0;
 for(const font of fontCollection){const license=await readFile(new URL(`../public${font.faces[0].path.replace(/\d+\.woff2$/,"OFL.txt")}`,import.meta.url),"utf8");assert.match(license,/SIL OPEN FONT LICENSE/i);
  for(const face of font.faces){const bytes=await readFile(new URL("../public"+face.path,import.meta.url));assert.equal(bytes.toString("ascii",0,4),"wOF2");assert.equal(createHash("sha256").update(bytes).digest("hex"),face.sha256);count++;}}
 assert.equal(count,84);
});
test("font loading is deduplicated by family/face, allows system fonts without requests and retries failures",async()=>{
 const previousFace=globalThis.FontFace,previousDoc=globalThis.document;let loads=0,adds=0,fail=true;
 globalThis.document={fonts:{add(){adds++;}}};
 globalThis.FontFace=class {constructor(name,url,options){this.name=name;this.url=url;this.options=options;}async load(){loads++;if(this.name==="Sacramento"&&fail)throw Error("network");return this;}};
 try{await ensureFont("Arial");assert.equal(loads,0);await Promise.all([ensureFont("Inter"),ensureFont("Inter")]);assert.equal(loads,1);assert.equal(adds,1);await ensureFont("Inter","bold");assert.equal(loads,2);await assert.rejects(ensureFont("Sacramento"));fail=false;await ensureFont("Sacramento");assert.equal(loads,4);await assert.rejects(ensureFont("untrusted-url"));}
 finally{if(previousFace===undefined)delete globalThis.FontFace;else globalThis.FontFace=previousFace;if(previousDoc===undefined)delete globalThis.document;else globalThis.document=previousDoc;}
});
test("all available presets are editable native text, survive history/storage/clipboard and preserve text content",async()=>{
 assert.ok(textPresets.length>=14);
 assert.equal(new Set(textPresets.map(p=>p.id)).size,textPresets.length);
 for(const p of textPresets){const old=textDoc(),next=patchElement(old,"text-one",presetPatch(p.id));assert.equal(next.schemaVersion,2);assert.equal(next.elements[0].text,old.elements[0].text);assert.deepEqual(validateDocument(next),next);
 const h=commit(history(old),next);assert.deepEqual(undo(h).present,old);assert.deepEqual(redo(undo(h)).present,next);
 await designStore.save(`type-${p.id}`,next,0);assert.deepEqual((await designStore.loadConnected(`type-${p.id}`)).document,next);
 const pasted=pasteSelection(newDesign(),clipboardPayload(next,["text-one"]),()=>"pasted");assert.deepEqual(pasted.document.elements[0].textStyle,next.elements[0].textStyle);}
});
test("formatting and effect attributes support combined italic/bold, underline, spacing, outlines, gradient and shadow",()=>{
 let e=patchElement(textDoc(),"text-one",{...presetPatch("gradient"),fontWeight:"bold"}).elements[0];e.textStyle={...e.textStyle,italic:true,underline:true,letterSpacing:2,outlineWidth:3,shadowOpacity:.7,shadowBlur:12,shadowOffsetX:4};
 const attrs=textStyleAttributes(e);assert.equal(attrs.fontStyle,"italic bold");assert.equal(attrs.textDecoration,"underline");assert.equal(attrs.letterSpacing,2);assert.equal(attrs.strokeWidth,3);assert.equal(attrs.shadowEnabled,true);assert.equal(attrs.fillPriority,"linear-gradient");assert.deepEqual(attrs.fillLinearGradientColorStops,[0,e.textStyle.gradientFrom,1,e.textStyle.gradientTo]);
 for(const effect of ["shadow","outline","glow","offset","neon","gradient"]){const s=effectStyle(effect);assert.equal(s.effect,effect);assert.deepEqual(validateTextStyle(s),s);}
});
test("group and pointer scaling preserve text styling and scale dimensional effects proportionally",()=>{
 let doc=patchElement(textDoc(),"text-one",presetPatch("retro"));doc=addElement(doc,makeElement("rect","shape"));doc=groupSelection(doc,["text-one","shape"],"group");
 const out=transformSelection(doc,["text-one","shape"],{scale:1.5,rotation:30});const e=out.elements[0],old=doc.elements[0];assert.equal(e.textStyle.shadowOffsetX,old.textStyle.shadowOffsetX*1.5);assert.equal(e.textStyle.outlineWidth,old.textStyle.outlineWidth*1.5);assert.equal(e.textStyle.effect,old.textStyle.effect);
 const patch=finalTransformPatches([old],[{id:old.id,x:old.x,y:old.y,rotation:0,scaleX:1.5,scaleY:1.5}])[0].patch;assert.deepEqual(patch.textStyle,e.textStyle);assert.deepEqual(scaleTextStyle(undefined,2),{});
});
test("typography validation rejects malformed styles without altering existing v1 text documents",()=>{
 const old=textDoc();assert.deepEqual(validateDocument(old),old);assert.equal(old.elements[0].textStyle,undefined);
 for(const input of [{italic:"yes"},{effect:"script"},{shadowBlur:NaN},{shadowColor:"url(evil)"},{outlineWidth:-1},{gradientAngle:999},{unknown:"x"},[]])assert.throws(()=>validateTextStyle(input));
 const styled=patchElement(old,"text-one",presetPatch("neon"));assert.throws(()=>validateDocument({...styled,schemaVersion:1}));
});

import {connectionAction,portableEnvelope,parsePortable} from "../src/lib/connected/model.js";
test("connected updates, local overrides, restoration and portable projects retain advanced typography",()=>{
 const campaign=normalizeCampaign({id:"type-campaign",name:"Typography",connectedVersion:1,sharedFields:[{id:"headline",label:"Headline",type:"text",value:"Shared title"}],assets:{}});
 let doc=patchElement(textDoc(),"text-one",{binding:{campaignId:campaign.id,fieldId:"headline",transform:"plain"}});
 doc=patchElement(doc,"text-one",presetPatch("gradient"));assert.equal(doc.elements[0].localOverride,false);
 const resolved=resolveDocument(doc,[campaign]).document;assert.equal(resolved.elements[0].text,"Shared title");assert.deepEqual(resolved.elements[0].textStyle,doc.elements[0].textStyle);
 const overridden=patchElement(resolved,"text-one",{text:"Local title"});assert.equal(resolveDocument(overridden,[campaign]).document.elements[0].text,"Local title");
 const restored=connectionAction(overridden,"text-one","restore",[campaign]);assert.equal(restored.elements[0].text,"Shared title");assert.deepEqual(restored.elements[0].textStyle,doc.elements[0].textStyle);
 const portable=parsePortable(portableEnvelope(restored,[campaign]));assert.deepEqual(portable.document,restored);assert.equal(portable.document.elements[0].fontFamily,"Outfit");
});

import {fitPresetToBox} from "../src/lib/typography/presets.js";
import {approximateMeasure,documentWarnings} from "../src/lib/templates/fitting.js";
test("one-click presets fit the existing text box without rewriting connected content",()=>{
 const old=textDoc(),element=old.elements[0];
 for(const preset of textPresets){const patch=fitPresetToBox(element,presetPatch(preset.id),approximateMeasure),doc=patchElement(old,element.id,patch);assert.equal(doc.elements[0].text,element.text);assert.equal(doc.elements[0].width,element.width);assert.deepEqual(documentWarnings(doc),[],preset.id);}
});

test("advanced style upgrade retains the original v1 project backup",async()=>{
 const original=textDoc();await designStore.save("type-backup",original,0);
 const changed=patchElement(original,"text-one",presetPatch("retro"));await designStore.save("type-backup",changed,1);
 const saved=await designStore.load("type-backup");assert.deepEqual(saved.document,changed);assert.deepEqual(saved.legacyV1Backup.document,original);
});
