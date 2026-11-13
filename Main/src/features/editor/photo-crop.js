"use client";
import {useEffect,useRef,useState} from "react";
import {moveCrop,resizeCrop,sourceDelta} from "@/lib/editor/crop";
import {coverCrop} from "@/lib/templates/fitting";
import {loadRenderImage} from "@/lib/editor/images";
import {StudioIcon} from "@/components/ui/studio-icon";
export default function PhotoCrop({element:e,asset,zoom,onApply,onCancel}){
 const [src,setSrc]=useState(""),[locked,setLocked]=useState(true),box=useRef(null),draft=useRef({...e.crop}),drag=useRef(null),channel=useRef(null);
 const scale=Math.min(e.width/asset.width,e.height/asset.height),w=asset.width*scale*zoom,h=asset.height*scale*zoom;
 function paint(){const c=draft.current;if(box.current)Object.assign(box.current.style,{left:`${c.x*100}%`,top:`${c.y*100}%`,width:`${c.width*100}%`,height:`${c.height*100}%`});}
 useEffect(()=>{let active=true;loadRenderImage(asset.src,e.photoStyle).then(canvas=>{if(active)setSrc(canvas.toDataURL("image/png"));canvas.width=0;canvas.height=0;}).catch(()=>{if(active)setSrc(asset.src);});return()=>{active=false;};},[asset.src,e.photoStyle]);
 useEffect(()=>{function key(event){if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();onCancel();}}window.addEventListener("keydown",key,true);return()=>{window.removeEventListener("keydown",key,true);cancelAnimationFrame(channel.current);};},[onCancel]);
 function pointer(event,corner){event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,crop:{...draft.current},corner};}
 function move(event){if(!drag.current)return;const d=drag.current,delta=sourceDelta(event.clientX-d.x,event.clientY-d.y,e.rotation,w,h);draft.current=d.corner?resizeCrop(d.crop,d.corner,delta.x,delta.y,locked?(e.width/e.height)/(asset.width/asset.height):null):moveCrop(d.crop,delta.x,delta.y);if(channel.current===null)channel.current=requestAnimationFrame(()=>{channel.current=null;paint();});}
 function end(event){move(event);drag.current=null;cancelAnimationFrame(channel.current);channel.current=null;paint();}
 return <div className="photo-crop-mode" onPointerDown={event=>event.stopPropagation()}>
  <div className="crop-command-bar" role="toolbar" aria-label="Crop photo"><strong><StudioIcon name="crop" size={15}/> Crop</strong><button title="Reset to fill frame" onClick={()=>{draft.current=coverCrop(asset,e.width,e.height);paint();}}>Reset</button><button onClick={onCancel}>Cancel</button><button className="editor-primary" onClick={()=>onApply(draft.current)}>Apply</button><label><input type="checkbox" checked={locked} onChange={event=>setLocked(event.target.checked)}/> Keep ratio</label></div>
  <div className="crop-photo-frame" style={{left:e.x*zoom,top:e.y*zoom,width:e.width*zoom,height:e.height*zoom,transform:`rotate(${e.rotation}deg)`}}>
   <div className="crop-source" style={{width:w,height:h,left:(e.width*zoom-w)/2,top:(e.height*zoom-h)/2}}>
    {/* Embedded local image; no network URL or flattening is saved. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src||asset.src} alt="Full photo for cropping" draggable={false}/>
    <div ref={box} className="crop-selection" style={{left:`${e.crop.x*100}%`,top:`${e.crop.y*100}%`,width:`${e.crop.width*100}%`,height:`${e.crop.height*100}%`}} tabIndex={0} role="region" aria-label="Move crop area" onKeyDown={event=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();event.stopPropagation();draft.current=moveCrop(draft.current,event.key==="ArrowLeft"?-.01:event.key==="ArrowRight"?.01:0,event.key==="ArrowUp"?-.01:event.key==="ArrowDown"?.01:0);paint();}} onPointerDown={event=>pointer(event,null)} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;}}>
     <span className="crop-grid"/>{["nw","ne","sw","se"].map(c=><button key={c} className={`crop-corner crop-${c}`} aria-label={`Resize crop ${c}`} onPointerDown={event=>pointer(event,c)} onKeyDown={event=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();event.stopPropagation();draft.current=resizeCrop(draft.current,c,event.key==="ArrowLeft"?-.01:event.key==="ArrowRight"?.01:0,event.key==="ArrowUp"?-.01:event.key==="ArrowDown"?.01:0,locked?(e.width/e.height)/(asset.width/asset.height):null);paint();}}/>)}
    </div>
   </div>
  </div>
  <p className="crop-help">Drag inside to reposition. Drag a corner to crop. Escape cancels.</p>
 </div>;
}
