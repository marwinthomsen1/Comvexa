"use client";
import {useEffect,useRef,useState} from "react";
import {PHOTO_DEFAULTS,photoPresets} from "@/lib/editor/photo-style";
import {StudioIcon} from "@/components/ui/studio-icon";
export default function PhotoControls({element:e,onPatch,onCrop,onReplace,onMore}){
 const [tab,setTab]=useState(""),[draft,setDraft]=useState({...PHOTO_DEFAULTS,...e.photoStyle});
 const pending=useRef(null),callback=useRef(onPatch);callback.current=onPatch;
 useEffect(()=>{setDraft({...PHOTO_DEFAULTS,...e.photoStyle});},[e.photoStyle]);
 useEffect(()=>()=>clearTimeout(pending.current),[]);
 function change(key,value){const next={...draft,[key]:value};setDraft(next);clearTimeout(pending.current);pending.current=setTimeout(()=>{pending.current=null;callback.current({photoStyle:next});},100);}
 function flush(){if(pending.current){clearTimeout(pending.current);pending.current=null;callback.current({photoStyle:draft});}}
 return <div className="photo-controls">
  <div className="photo-tool-row" role="toolbar" aria-label="Photo tools">{[["crop","crop","Crop"],["replace","image","Replace"],["adjust","settings","Adjust"],["effects","spark","Effects"],["more","more","More"]].map(([id,icon,label])=><button key={id} title={label} aria-label={`${label} photo`} aria-pressed={id===tab} onClick={()=>{flush();if(id==="crop")onCrop();else if(id==="replace")onReplace();else if(id==="more")onMore();else setTab(tab===id?"":id);}}><StudioIcon name={icon}/><span>{label}</span></button>)}</div>
  {tab==="adjust"&&<section className="photo-adjustments" aria-label="Photo adjustments">{Object.entries(draft).map(([key,value])=><label key={key} className="photo-slider">{key[0].toUpperCase()+key.slice(1)}<output>{value}</output><input type="range" min={-100} max={100} value={value} onChange={event=>change(key,Number(event.target.value))} onPointerUp={flush} onBlur={flush}/></label>)}<button className="subtle-button" onClick={()=>{clearTimeout(pending.current);pending.current=null;onPatch({photoStyle:{...PHOTO_DEFAULTS}});}}>Reset adjustments</button></section>}
  {tab==="effects"&&<div className="photo-effect-grid">{photoPresets.map(p=><button key={p.name} onClick={()=>{clearTimeout(pending.current);pending.current=null;onPatch({photoStyle:{...p.style}});}}>{p.name}</button>)}</div>}
 </div>;
}
