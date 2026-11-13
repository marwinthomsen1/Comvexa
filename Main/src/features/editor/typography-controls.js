"use client";
import {useEffect,useRef,useState} from "react";
import {fontCategories,searchFonts,ensureFont,FONT_NAMES} from "@/lib/typography/fonts";
import {TEXT_STYLE_DEFAULTS,TEXT_EFFECTS,effectStyle} from "@/lib/typography/style";
import {browserMeasure} from "@/lib/templates/fitting";
import {textPresets,presetPatch,fitPresetToBox} from "@/lib/typography/presets";
import {StudioIcon} from "@/components/ui/studio-icon";
function FontPreview({family,children,style}) {
 const ref=useRef(null),[ready,setReady]=useState(false);
 useEffect(()=>{let active=true;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();ensureFont(family).then(()=>{if(active)setReady(true);}).catch(()=>{});}});observer.observe(ref.current);return()=>{active=false;observer.disconnect();};},[family]);
 return <span ref={ref} style={{...style,fontFamily:ready?family:undefined}}>{children||family}</span>;
}
export default function TypographyControls({element:e,onPatch,Field}) {
 const [query,setQuery]=useState(""),[category,setCategory]=useState("All"),[limit,setLimit]=useState(8),[busy,setBusy]=useState(false),[error,setError]=useState(""),[recent,setRecent]=useState([]);
 const active=useRef(true),request=useRef(0),fontPicker=useRef(null);
 useEffect(()=>{active.current=true;try{const r=JSON.parse(localStorage.getItem("comvexa-recent-fonts")||"[]");if(Array.isArray(r))setRecent(r.filter(n=>FONT_NAMES.includes(n)).slice(0,6));}catch{/* Font history is optional when local storage is unavailable. */}return()=>{active.current=false;};},[]);
 const s={...TEXT_STYLE_DEFAULTS,...e.textStyle},fonts=searchFonts(query,category);
 async function patch(values, fit = false) {
  const sequence=++request.current;setBusy(true);setError("");
  try {
   await ensureFont(values.fontFamily||e.fontFamily,values.fontWeight||e.fontWeight);
   if(!active.current||sequence!==request.current)return;
   onPatch(fit ? fitPresetToBox(e,values,browserMeasure) : values);
   if(values.fontFamily) {if(fontPicker.current)fontPicker.current.open=false;const next=[values.fontFamily,...recent.filter(n=>n!==values.fontFamily)].slice(0,6);setRecent(next);try{localStorage.setItem("comvexa-recent-fonts",JSON.stringify(next));}catch{/* Font history is optional when local storage is unavailable. */}}
  }catch(err){if(active.current&&sequence===request.current)setError(err.message);}
  finally{if(active.current&&sequence===request.current)setBusy(false);}
 }
 const style=(key,value)=>onPatch({textStyle:{...s,[key]:value}});
 return <div className="typography-controls">
  {error&&<p role="alert" className="typography-error">{error}</p>}
  {busy&&<p role="status">Loading font…</p>}
  <details ref={fontPicker} className="studio-details font-picker"><summary aria-label={`Choose font: ${e.fontFamily}`}><StudioIcon name="type" size={16}/><span>{e.fontFamily}</span><StudioIcon name="chevron" size={14}/></summary>
   <label className="editor-field">Search 54 fonts<input type="search" value={query} onChange={event=>{setQuery(event.target.value);setLimit(8);}} placeholder="Search fonts…"/></label>
   <label className="editor-field">Font category<select value={category} onChange={event=>{setCategory(event.target.value);setLimit(8);}}>{fontCategories.map(c=><option key={c}>{c}</option>)}</select></label>
   {recent.length>0&&<div className="recent-fonts"><small>Recently used</small>{recent.map(name=><button key={name} disabled={busy} onClick={()=>patch({fontFamily:name})}>{name}</button>)}</div>}
   <div className="font-preview-list">{fonts.slice(0,limit).map(f=><button key={f.name} disabled={busy} aria-pressed={e.fontFamily===f.name} onClick={()=>patch({fontFamily:f.name})}><FontPreview family={f.name}/><small>{f.category}</small></button>)}</div>
   {!fonts.length&&<p>No matching fonts.</p>}
   {limit<fonts.length&&<button className="panel-wide" onClick={()=>setLimit(n=>n+8)}>Show more fonts ({fonts.length-limit})</button>}
  </details>
  <div className="type-size-color"><Field label="Size" value={e.fontSize} min={6} max={600} onChange={v=>onPatch({fontSize:v})}/><label className="editor-field">Text color<input type="color" value={e.fill} onChange={event=>onPatch({fill:event.target.value})}/></label></div>
  <div className="type-toggle-row"><button aria-label="Bold text" aria-pressed={e.fontWeight==="bold"} disabled={busy} onClick={()=>patch({fontWeight:e.fontWeight==="bold"?"normal":"bold"})}><StudioIcon name="bold"/></button><button aria-label="Italic text" aria-pressed={s.italic} onClick={()=>style("italic",!s.italic)}><StudioIcon name="italic"/></button><button aria-label="Underline text" aria-pressed={s.underline} onClick={()=>style("underline",!s.underline)}><StudioIcon name="underline"/></button></div>
  <div className="type-toggle-row" role="group" aria-label="Text alignment">{["left","center","right"].map(a=><button key={a} aria-label={`Align text ${a}`} aria-pressed={e.align===a} onClick={()=>onPatch({align:a})}><StudioIcon name={`align-${a}`}/></button>)}</div>
  <label className="editor-field type-effect-choice"><span><StudioIcon name="spark" size={14}/> Effects</span><select aria-label="Text effect" value={s.effect} onChange={event=>onPatch({textStyle:effectStyle(event.target.value,s)})}>{TEXT_EFFECTS.map(f=><option key={f}>{f}</option>)}</select></label>
  <details className="studio-details"><summary><StudioIcon name="settings" size={16}/> Spacing & text box</summary>
   <Field label="Letter spacing" value={s.letterSpacing} min={-10} max={100} step={.5} onChange={v=>style("letterSpacing",v)}/>
   <Field label="Line height" value={e.lineHeight} min={.5} max={3} step={.05} onChange={v=>onPatch({lineHeight:v})}/>
   <div className="editor-fields"><Field label="Text box width" value={e.width} min={1} max={8192} onChange={v=>onPatch({width:v})}/><Field label="Text box height" value={e.height} min={1} max={8192} onChange={v=>onPatch({height:v})}/></div>
   <Field label="Text rotation" value={e.rotation} min={-360} max={360} onChange={v=>onPatch({rotation:v})}/>
   <Field label="Opacity" value={e.opacity} min={0} max={1} step={.05} onChange={v=>onPatch({opacity:v})}/><p>Box dimensions change wrapping. Corner handles scale text proportionally.</p>
  </details>
  <details className="studio-details"><summary><StudioIcon name="spark" size={16}/> Effect settings</summary>

   {s.effect==="gradient"&&<><label className="editor-field">Gradient start<input type="color" value={s.gradientFrom} onChange={event=>style("gradientFrom",event.target.value)}/></label><label className="editor-field">Gradient end<input type="color" value={s.gradientTo} onChange={event=>style("gradientTo",event.target.value)}/></label><p>Gradient colors replace the flat text color.</p><Field label="Gradient angle" value={s.gradientAngle} min={0} max={360} onChange={v=>style("gradientAngle",v)}/></>}
   <label className="editor-field">Outline color<input type="color" value={s.outlineColor} onChange={event=>style("outlineColor",event.target.value)}/></label>
   <Field label="Outline width" value={s.outlineWidth} min={0} max={30} step={.5} onChange={v=>style("outlineWidth",v)}/>
   <label className="editor-field">Shadow / glow color<input type="color" value={s.shadowColor} onChange={event=>style("shadowColor",event.target.value)}/></label>
   <Field label="Intensity" value={s.shadowOpacity} min={0} max={1} step={.05} onChange={v=>style("shadowOpacity",v)}/>
   <Field label="Blur" value={s.shadowBlur} min={0} max={80} onChange={v=>style("shadowBlur",v)}/>
   <div className="editor-fields"><Field label="Shadow X" value={s.shadowOffsetX} min={-100} max={100} onChange={v=>style("shadowOffsetX",v)}/><Field label="Shadow Y" value={s.shadowOffsetY} min={-100} max={100} onChange={v=>style("shadowOffsetY",v)}/></div>
  </details>
  <details className="studio-details"><summary><StudioIcon name="type" size={16}/> Text style presets</summary><div className="text-preset-grid">{textPresets.map(p=><button key={p.id} disabled={busy} style={{background:["neon","sale"].includes(p.id)?"#17122f":"#f7f4eb",color:["neon","sale"].includes(p.id)?"#ffffff":"#241443"}} onClick={()=>patch(presetPatch(p.id),true)}><FontPreview family={p.fontFamily} style={{color:p.fill,fontWeight:p.fontWeight,textShadow:p.effect==="offset"?"2px 2px #b64e32":p.effect==="neon"?"0 0 7px #f43a9b":"none"}}>Aa</FontPreview><small>{p.name}</small></button>)}</div><p>Apply a style, then customize it. Single-weight fonts use browser-synthesized bold or italic when needed.</p></details>
 </div>;
}
