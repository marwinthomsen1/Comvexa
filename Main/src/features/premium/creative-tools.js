"use client";
import {useState} from 'react';
import dynamic from 'next/dynamic';
import {StudioIcon} from '@/components/ui/studio-icon';
const BrandPanel=dynamic(()=>import('./brand-panel'));
const BulkPanel=dynamic(()=>import('./bulk-panel'));
const PhotoBackgroundPanel=dynamic(()=>import('./photo-background-panel'));
const StylePanel=dynamic(()=>import('./style-panel'));
const tools=[['brands','palette','Brand Kit'],['background','image','Photo Backgrounds'],['styles','spark','Professional Styles'],['bulk','layers','Bulk Create']];
export default function CreativeTools({doc,element,selectedIds,onApply,onSelect,onOpen,onError,onTool}){const [active,setActive]=useState('');return <div><p className="editor-small">Useful creative tools, available for testing. Advanced options stay inside each tool.</p><div className="creative-tool-cards">{tools.map(([id,icon,name])=><button key={id} aria-pressed={active===id} onClick={()=>setActive(active===id?'':id)}><StudioIcon name={icon}/><span>{name}</span></button>)}</div>{active==='brands'&&<BrandPanel doc={doc} selectedIds={selectedIds} onApply={onApply} onSelect={onSelect} onError={onError}/>} {active==='bulk'&&<BulkPanel doc={doc} onError={onError} onOpen={onOpen}/>} {active==='background'&&<PhotoBackgroundPanel doc={doc} element={element} onApply={onApply} onError={onError}/>} {active==='styles'&&<StylePanel doc={doc} selectedIds={selectedIds} onApply={onApply} onError={onError}/>}<details className="studio-details"><summary>More creative controls</summary><div className="premium-action-grid"><button onClick={()=>onTool('photo-adjust')}>Smart Photo Enhancement</button><button onClick={()=>onTool('photo-effects')}>Advanced Photo Effects</button><button onClick={()=>onTool('text')}>Text Effects</button><button onClick={()=>onTool('layout')}>Smart Layout</button></div><p className="editor-small">Select a photo or text layer for its contextual editing controls. Smart Layout uses your selection.</p></details></div>;}
