"use client";
import {useState} from "react";
import Image from "next/image";
import {elementLibrary} from "@/lib/elements/catalog";
import {insertLibraryElement} from "@/lib/elements/insert";
import {newDesign,patchElement} from "@/lib/editor/document";
import {renderExport} from "@/lib/editor/export";
export default function ElementsQA() {
 const [status,setStatus]=useState("Ready"),[results,setResults]=useState([]),[busy,setBusy]=useState(false);
 async function run() {
  setBusy(true); const rows=[];
  for(const item of elementLibrary) {
   setStatus(`Rendering ${item.name}`);
   try {
    let doc=insertLibraryElement(newDesign(item.name,320,320),item.id,"one");
    doc=patchElement(doc,"one",{fill:"#8955ed",stroke:"#3f2870",strokeWidth:1});
    let preview;
    for(const format of ["png","jpeg"]) {
     const blob=await renderExport(doc,format,.92);
     const decoded=await createImageBitmap(blob);
     if(decoded.width!==320||decoded.height!==320) throw new Error("Wrong export size");
     const canvas=document.createElement("canvas");canvas.width=320;canvas.height=320;
     const ctx=canvas.getContext("2d");ctx.drawImage(decoded,0,0);decoded.close();
     const data=ctx.getImageData(0,0,320,320).data;let ink=0;
     for(let i=0;i<data.length;i+=4) if(data[i]<220||data[i+1]<220||data[i+2]<220) ink++;
     if(ink<60) throw new Error("Empty graphic export");
     if(format==="png") preview=URL.createObjectURL(blob);
    }
    rows.push({id:item.id,name:item.name,result:"PASS",preview});
   }catch(e){rows.push({id:item.id,name:item.name,result:"FAIL",error:e.message});}
  }
  setResults(rows);setStatus(`${rows.filter(r=>r.result==="PASS").length}/${elementLibrary.length} PASS · real PNG/JPG dimensions and nonempty pixel checks`);setBusy(false);
 }
 return <main style={{padding:30}}><h1>Elements render and export acceptance</h1><button disabled={busy} onClick={run}>Verify all 79 elements</button><p role="status">{status}</p><div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:15}}>{results.map(r=><article key={r.id}>{r.preview&&<Image unoptimized src={r.preview} alt={r.name} width={160} height={160} style={{width:"100%",height:"auto"}}/>}<p>{r.name}: {r.result} {r.error}</p></article>)}</div></main>;
}
