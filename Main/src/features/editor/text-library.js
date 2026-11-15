"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {useAssetPreferences} from './workspace/preferences';
import {AssetFavorite,AssetViewFilter} from './workspace/asset-controls';
import {filterAssetItems,rememberAsset} from '@/lib/workspace-ui/preferences';
import {textDesigns,textDesignCategories} from '@/lib/typography/designs';
import {ensureFont} from '@/lib/typography/fonts';
function TextDesignPreview({design}){
 const root=useRef(null),prefix=useId().replaceAll(':','');
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();Promise.all(design.elements.filter(e=>e.type==='text').map(e=>ensureFont(e.fontFamily,e.fontWeight))).catch(()=>{});}},{rootMargin:'60px'});observer.observe(root.current);return()=>observer.disconnect();},[design]);
 return <svg ref={root} viewBox="0 0 600 260" aria-hidden="true" focusable="false"><rect width="600" height="260" rx="16" fill={design.background}/>{design.elements.map((e,i)=>{
 if(e.type==='rect')return <rect key={i} x={e.x} y={e.y} width={e.width} height={e.height} rx={e.cornerRadius} fill={e.fill}/>;
 const s=e.textStyle||{},id=prefix+'-'+i;
 return <g key={i}><defs><linearGradient id={id+'-gradient'} x2={s.gradientAngle===90?'0%':'100%'} y2={s.gradientAngle===90?'100%':'0%'}><stop stopColor={s.gradientFrom||e.fill}/><stop offset="1" stopColor={s.gradientTo||e.fill}/></linearGradient><filter id={id+'-shadow'} x="-50%" y="-100%" width="200%" height="300%"><feDropShadow dx={s.shadowOffsetX||0} dy={s.shadowOffsetY||0} stdDeviation={(s.shadowBlur||0)/2} floodColor={s.shadowColor} floodOpacity={s.shadowOpacity||0}/></filter></defs><text x={e.x+e.width/2} y={e.y+e.fontSize*.9} fontSize={e.fontSize} fontFamily={e.fontFamily} fontWeight={e.fontWeight} fontStyle={s.italic?'italic':'normal'} textAnchor="middle" letterSpacing={s.letterSpacing||0} fill={s.effect==='gradient'?`url(#${id}-gradient)`:e.fill} stroke={s.outlineColor} strokeWidth={s.outlineWidth||0} paintOrder="stroke fill" filter={s.shadowOpacity?`url(#${id}-shadow)`:undefined}>{e.text.split('\n').map((line,n)=><tspan key={n} x={e.x+e.width/2} dy={n?e.fontSize*e.lineHeight:0}>{line}</tspan>)}</text></g>;
 })}</svg>;
}
export default function TextLibrary({onAdd,onInsert}){
 const prefs=useAssetPreferences(),[view,setView]=useState('all');
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All'),[busy,setBusy]=useState('');
 const items=filterAssetItems(textDesigns,'text-design',view,prefs).filter(d=>(category==='All'||d.category===category)&&`${d.name} ${d.category} ${d.elements.map(e=>e.text||'').join(' ')}`.toLowerCase().includes(query.toLowerCase()));
 return <div className="text-design-library"><div className="text-quick-add"><button onClick={()=>onAdd('heading')}>Add heading</button><button onClick={()=>onAdd('subheading')}>Add subheading</button><button onClick={()=>onAdd('body')}>Add body text</button></div><div className="text-library-heading"><h3>Text designs</h3><span>{textDesigns.length} editable styles</span></div><label className="editor-field"><span className="sr-only">Search text designs</span><input type="search" placeholder="Search neon, sale, birthday…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="editor-field"><span className="sr-only">Text design category</span><select value={category} onChange={e=>setCategory(e.target.value)}>{textDesignCategories.map(c=><option key={c}>{c}</option>)}</select></label><AssetViewFilter value={view} onChange={setView}/><div className="text-design-grid">{items.map(d=><div key={d.id} className="asset-entry"><button className="text-design-card" disabled={!!busy} aria-label={`Add ${d.name} text design`} title={d.name} onClick={async()=>{setBusy(d.id);try{await onInsert(d.id);rememberAsset('text-design:'+d.id);}finally{setBusy('');}}}><TextDesignPreview design={d}/><span><strong>{busy===d.id?'Adding…':d.name}</strong><small>{d.category} <span aria-hidden="true">＋</span></small></span></button><AssetFavorite kind="text-design" id={d.id} name={d.name} prefs={prefs}/></div>)}</div>{!items.length&&<p>No matching text designs.</p>}<p className="text-library-tip">All lettering stays editable. Double-click text to write your own.</p></div>;
}
