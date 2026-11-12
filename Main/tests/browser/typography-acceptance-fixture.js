"use client";
import {useState} from "react";
import Image from "next/image";
import {flushSync} from "react-dom";
import Konva from "konva";
import DesignCanvas from "@/features/editor/design-canvas";
import {fontCollection,ensureFont} from "@/lib/typography/fonts";
import {textPresets,presetPatch} from "@/lib/typography/presets";
import {newDesign,makeElement,addElement,patchElement} from "@/lib/editor/document";
import {renderExport} from "@/lib/editor/export";
import {designStore} from "@/lib/editor/store";
export default function QA(){
 const [status,setStatus]=useState("Ready"),[rows,setRows]=useState([]),[live,setLive]=useState(null);
 async function run(){const results=[];setStatus("Loading 50 local families…");
 for(const font of fontCollection){try{for(const face of font.faces)await ensureFont(font.name,face.weight===700?"bold":"normal");results.push({name:font.name,result:"PASS"});}catch(e){results.push({name:font.name,result:"FAIL",error:e.message});}}
 let previews=0;
 for(const preset of textPresets){try{let doc=newDesign(preset.name,800,450);doc.canvas.background=["neon","sale"].includes(preset.id)?"#17122f":"#f7f4eb";doc=addElement(doc,{...makeElement("text","headline"),x:60,y:100,width:680,height:280,text:preset.id==="invitation"?"Together, always":"Create something great"});doc=patchElement(doc,"headline",presetPatch(preset.id));const key=crypto.randomUUID();await designStore.save(key,doc,0);const reopened=await designStore.loadConnected(key);if(JSON.stringify(reopened.document)!==JSON.stringify(doc))throw Error("Reopen differs");let preview,maxDifference=0;
 flushSync(()=>setLive(doc));
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const liveStage=Konva.stages.find(s=>s.container().closest("[data-typography-preview]"));
 const liveCanvas=liveStage.toCanvas({x:72,y:72,width:800,height:450,pixelRatio:1});
 const livePixels=liveCanvas.getContext("2d").getImageData(0,0,800,450).data;
 for(const format of ["png","jpeg"]){const blob=await renderExport(doc,format,.92);const bitmap=await createImageBitmap(blob);if(bitmap.width!==800||bitmap.height!==450)throw Error("Export size");if(format==="png"){const check=document.createElement("canvas");check.width=800;check.height=450;const ctx=check.getContext("2d");ctx.drawImage(bitmap,0,0);const pixels=ctx.getImageData(0,0,800,450).data;let changed=0;for(let i=0;i<pixels.length;i+=4)if(Math.abs(pixels[i]-livePixels[i])+Math.abs(pixels[i+1]-livePixels[i+1])+Math.abs(pixels[i+2]-livePixels[i+2])>6)changed++;maxDifference=changed/(800*450);if(maxDifference>.005)throw Error(`Canvas/export pixels differ: ${maxDifference}`);}
 bitmap.close();if(format==="png")preview=URL.createObjectURL(blob);}
 results.push({name:preset.name,result:"PASS",preview,maxDifference,editor:`/editor/${key}`});previews++;}catch(e){results.push({name:preset.name,result:"FAIL",error:e.message});}}
 setRows(results);setStatus(`${results.filter(r=>r.result==="PASS").length}/60 PASS · 50 fonts / ${previews} editable presets · ${previews*2} exports`);
 }
 return <main style={{padding:30}}><h1>Stage C browser acceptance</h1><button onClick={run}>Verify fonts and presets</button><p role="status">{status}</p>{live&&<div data-typography-preview style={{position:"fixed",left:-3000,width:800,height:450}}><DesignCanvas doc={live} selectedIds={[]} select={()=>{}} patch={()=>{}} patchMany={()=>{}} selectIds={()=>{}} multiSelect={false} snapping={false} zoom={1} preview={true} editId={null} setEditId={()=>{}} aspectLocked={false}/></div>}<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>{rows.map(r=><article key={r.name}>{r.preview&&<Image src={r.preview} unoptimized alt={r.name} width={800} height={450} style={{width:"100%",height:"auto"}}/>}<p>{r.name}: {r.result} {r.maxDifference!==undefined?`canvas/export difference ${r.maxDifference}`:""} {r.error}</p>{r.editor&&<a href={r.editor}>Open editable preset</a>}</article>)}</div></main>;
}
