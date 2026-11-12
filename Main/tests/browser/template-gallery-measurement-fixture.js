"use client";
import { useRef, useState } from "react";
import metadata from "@/lib/templates/curated-metadata.json";
export default function GalleryQA() {
  const frame = useRef(null), [mobile, setMobile] = useState(false), [result, setResult] = useState(null);
  function measure() {
    const w = frame.current.contentWindow, d = w.document;
    const images = w.performance.getEntriesByType("resource").filter(r => r.name.includes("studio-") && r.name.includes("webp"));
    const begin = performance.now();
    for(let n=0;n<5000;n++) metadata.templates.filter(t=>t.category==="events" && `${t.name} ${t.description}`.toLowerCase().includes("wedding"));
    setResult({viewport:w.innerWidth, documentWidth:d.documentElement.scrollWidth, cards:d.querySelectorAll(".curated-card").length, visibleDesigns:d.querySelector(".curated-results p")?.textContent, loadedThumbnails:images.length, thumbnailTransferredBytes:images.reduce((n,r)=>n+r.transferSize,0), fullResolutionPhotoRequests:w.performance.getEntriesByType("resource").filter(r=>r.name.includes("/images/previews/")).length, filter5000Ms:Math.round((performance.now()-begin)*100)/100});
  }
  return <main style={{padding:12}}><h1>Gallery acceptance measurements</h1><button onClick={()=>setMobile(v=>!v)}>Toggle 390px viewport</button> <button onClick={measure}>Measure current gallery</button><pre>{JSON.stringify(result,null,2)}</pre><iframe title="Actual template gallery" ref={frame} src="/dashboard/templates" style={{width:mobile?390:"100%",height:1200,border:"1px solid #888",maxWidth:"100%"}} /></main>;
}
