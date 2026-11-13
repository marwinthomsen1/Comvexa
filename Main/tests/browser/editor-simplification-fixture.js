"use client";
import {useState} from "react";
import {flushSync} from "react-dom";
import Konva from "konva";
import Image from "next/image";
import DesignCanvas from "@/features/editor/design-canvas";
import {newDesign,makeElement,validateDocument,patchElement} from "@/lib/editor/document";
import {readImage} from "@/lib/editor/images";
import {renderExport} from "@/lib/editor/export";
import {designStore} from "@/lib/editor/store";
import {photoPresets} from "@/lib/editor/photo-style";
export default function QA(){const [live,setLive]=useState(null),[rows,setRows]=useState([]),[status,setStatus]=useState("Ready");
 async function run(){try {setStatus("Rendering photo adjustments…");const results=[],blob=await(await fetch('/images/previews/travel.webp')).blob(),asset=await readImage(new File([blob],"travel.webp",{type:blob.type}));
 for(const p of photoPresets){setStatus(`Checking ${p.name}`);try{let doc=validateDocument({...newDesign(p.name,800,500),assets:{photo:asset},elements:[{...makeElement("image","photo-one"),x:100,y:100,width:500,height:300,assetId:"photo",crop:{x:.1,y:.15,width:.7,height:.5}}]});doc=patchElement(doc,"photo-one",{photoStyle:p.style});const id=crypto.randomUUID();setStatus("Saving "+p.name);await designStore.save(id,doc,0);if(JSON.stringify((await designStore.loadConnected(id)).document)!==JSON.stringify(doc))throw Error("Reopen differs");setStatus("Mounting "+p.name);flushSync(()=>setLive(doc));let stage;
 for(let attempt=0;attempt<100;attempt++){await new Promise(resolve=>setTimeout(resolve,50));stage=Konva.stages.filter(Boolean).find(s=>s.container()?.closest('[data-photo-preview]'));if(stage?.find('Image').find(n=>n.id()==='photo-one')?.image())break;}
 if(!stage?.find('Image').find(n=>n.id()==='photo-one')?.image())throw Error('Canvas photo did not load');
 stage.draw();
 setStatus("Exporting "+p.name);
 const pixels=stage.toCanvas({x:72,y:72,width:800,height:500,pixelRatio:1}).getContext('2d').getImageData(0,0,800,500).data;let preview,difference;
 for(const format of ['png','jpeg']){const exported=await renderExport(doc,format,.92),bitmap=await createImageBitmap(exported);if(bitmap.width!==800||bitmap.height!==500)throw Error("Wrong export dimensions");if(format==='png'){const c=document.createElement('canvas');c.width=800;c.height=500;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);const actual=ctx.getImageData(0,0,800,500).data;let count=0;for(let i=0;i<actual.length;i+=4)if(Math.abs(actual[i]-pixels[i])+Math.abs(actual[i+1]-pixels[i+1])+Math.abs(actual[i+2]-pixels[i+2])>6)count++;difference=count/(800*500);if(difference>.005)throw Error('Canvas/export mismatch '+difference);preview=URL.createObjectURL(exported);}bitmap.close();}
 results.push({name:p.name,result:'PASS',difference,preview,editor:'/editor/'+id});}catch(e){results.push({name:p.name,result:'FAIL',error:e.message});}setRows([...results]);}
 setRows(results);setStatus(`${results.filter(r=>r.result==='PASS').length}/5 PASS · crop, adjustments, save/reopen and PNG/JPG exports`);
 } catch(e) {setStatus("FAIL: "+e.message);}
 }
 return <main style={{padding:30}}><h1>Editor simplification acceptance</h1><button onClick={run}>Verify photo preview and export</button><p role="status">{status}</p>{live&&<div data-photo-preview style={{position:'fixed',left:-3000,width:800,height:500}}><DesignCanvas key={live.name} doc={live} selectedIds={[]} select={()=>{}} patch={()=>{}} patchMany={()=>{}} selectIds={()=>{}} multiSelect={false} snapping={false} zoom={1} preview={true} editId={null} setEditId={()=>{}} aspectLocked={false}/></div>}<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>{rows.map(r=><article key={r.name}>{r.preview&&<Image unoptimized src={r.preview} alt={r.name} width={800} height={500} style={{width:'100%',height:'auto'}}/>}<p>{r.name}: {r.result}, pixel difference {r.difference} {r.error}</p>{r.editor&&<a href={r.editor}>Open photo editor</a>}</article>)}</div></main>;
}
