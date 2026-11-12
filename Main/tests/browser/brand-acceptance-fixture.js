"use client";
import {useRef,useState} from "react";
import {Brand} from "@/components/layout/brand";
export default function BrandQA() {
 const sample=useRef(null),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[dark,setDark]=useState(false),[placements,setPlacements]=useState([]);
 async function verify() {
  setBusy(true);
  const brand=sample.current.querySelector(".brand"),word=brand.querySelector(".brand-word"),svg=brand.querySelector("svg"),c=brand.querySelector(".brand-c");
  const before=word.getBoundingClientRect(),box=brand.getBoundingClientRect(),center=new DOMPoint(24.686291501,24),angles=new Set();
  const centerBefore=center.matrixTransform(c.getScreenCTM());let maxWordShift=0,maxCenterShift=0,maxBoxShift=0,distortion=0;
  const start=performance.now();
  await new Promise(resolve=>{function frame(){
   const r=word.getBoundingClientRect(),b=brand.getBoundingClientRect(),p=center.matrixTransform(c.getScreenCTM()),m=new DOMMatrix(getComputedStyle(c).transform);
   maxWordShift=Math.max(maxWordShift,Math.abs(r.x-before.x),Math.abs(r.y-before.y),Math.abs(r.width-before.width),Math.abs(r.height-before.height));
   maxBoxShift=Math.max(maxBoxShift,Math.abs(b.width-box.width),Math.abs(b.height-box.height));
   maxCenterShift=Math.max(maxCenterShift,Math.hypot(p.x-centerBefore.x,p.y-centerBefore.y));
   distortion=Math.max(distortion,Math.abs(Math.hypot(m.a,m.b)-1),Math.abs(Math.hypot(m.c,m.d)-1));
   angles.add(Math.round(Math.atan2(m.b,m.a)*180/Math.PI));
   if(performance.now()-start<12500)requestAnimationFrame(frame);else resolve();
  }requestAnimationFrame(frame);});
  const style=getComputedStyle(c);
  setResult({reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,animation:style.animationName,duration:style.animationDuration,origin:style.transformOrigin,word:word.textContent,wordTransform:getComputedStyle(word).transform,svgWidth:svg.getBoundingClientRect().width,maxWordShift,maxBoxShift,maxCenterShift,distortion,distinctAngles:angles.size});setBusy(false);
 }
 return <main style={{padding:40}} data-theme={dark?"dark":"light"}><h1>Brand motion acceptance</h1><button onClick={()=>{setDark(v=>!v);document.documentElement.dataset.theme=dark?"light":"dark";}}>Toggle test theme</button> <button disabled={busy} onClick={verify}>Measure 12.5-second cycle</button><pre>{busy?"Measuring…":JSON.stringify(result,null,2)}</pre><button onClick={()=>{const frames=document.querySelectorAll("iframe[data-brand-route]");setPlacements([...frames].map(f=>{const w=f.contentWindow,b=w.document.querySelector(".brand"),t=b?.querySelector(".brand-word"),s=b?.querySelector("svg");return {route:f.dataset.brandRoute,viewport:w.innerWidth,documentWidth:w.document.documentElement.scrollWidth,word:t?.textContent.trim(),textSize:t?getComputedStyle(t).fontSize:null,svgSize:s?.getBoundingClientRect().width,link:b?.getAttribute("aria-label")};}));}}>Read live mobile placements</button><div>{placements.map(p=><pre key={p.route}>{JSON.stringify(p,null,2)}</pre>)}</div><div ref={sample} style={{padding:30}}><Brand/></div><div className="workspace-sidebar" style={{padding:30}}><Brand/></div><div className="editor-top" style={{padding:30,display:"block"}}><Brand/></div>{["/","/login","/register","/dashboard","/editor/new"].map(route=><iframe key={route} data-brand-route={route} title={route} src={route} style={{width:390,height:600,border:"1px solid #888"}}/>)}</main>;
}
