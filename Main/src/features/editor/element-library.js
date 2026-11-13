"use client";
import CreativeLibrary from "./creative-library";
import { useMemo, useState } from "react";
import { elementLibrary, elementCategories, filterElements } from "@/lib/elements/catalog";
import { graphicBounds } from "@/lib/elements/bounds";
export function ElementPreview({item, color}) {
 const b=graphicBounds[item.id];
 return <svg style={{color}} viewBox={b?`${b.x-4} ${b.y-4} ${b.width+8} ${b.height+8}`:"-4 -4 108 108"} aria-hidden="true" focusable="false">
  {item.path ? <path d={item.path} fill="currentColor"/> : item.primitive === "ellipse" ? <ellipse fill="currentColor" cx="50" cy="50" rx="50" ry={50/item.ratio}/> : <rect fill="currentColor" x="0" y={50-50/item.ratio} width="100" height={100/item.ratio} rx={item.radius?Math.min(50/item.ratio,item.radius/2):0}/>}
 </svg>;
}
export default function ElementLibrary({onInsert,onSticker,onFrame}) {
 const [query,setQuery]=useState(""),[category,setCategory]=useState("All"),[fill,setFill]=useState("#8955ed");
 const items=useMemo(()=>filterElements(query,category),[query,category]);
 return <CreativeLibrary onSticker={onSticker} onFrame={onFrame}><div className="element-library">
  <p className="element-library-intro">{elementLibrary.length} editable shapes & graphics.</p>
  <label className="editor-field">Search elements<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try heart, arrow, sale…"/></label>
  <div className="element-library-filters"><label className="editor-field">Category<select value={category} onChange={e=>setCategory(e.target.value)}>{elementCategories.map(c=><option key={c}>{c}</option>)}</select></label><label className="editor-field">Color<input aria-label="New element color" type="color" value={fill} onChange={e=>setFill(e.target.value)}/></label></div>
  <p className="element-result-count" role="status">{items.length} {items.length===1?"element":"elements"}{category!=="All"?` · ${category}`:""}</p>
  <div className="element-library-grid">{items.map(item=><button key={item.id} type="button" title={`Add ${item.name}`} aria-label={`Add ${item.name}`} onClick={()=>onInsert(item.id,fill)}><ElementPreview item={item} color={fill}/><span>{item.name}</span></button>)}</div>
  {!items.length&&<div className="element-library-empty"><p>No matching elements.</p><button onClick={()=>{setQuery("");setCategory("All");}}>Clear filters</button></div>}
  <p className="element-library-note">Original Comvexa vectors. Recolor, resize, rotate, group and export without losing sharpness.</p>
 </div></CreativeLibrary>;
}
