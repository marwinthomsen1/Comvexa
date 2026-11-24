"use client";
import {STUDIO_TOOLS,toolGroup} from '../studio-tools';
import {StudioIcon} from '@/components/ui/studio-icon';
import {rememberTool} from '@/lib/workspace-ui/preferences';
import './tool-rail.css';

export default function ToolNavigation({tab,update,onTool,onSearch,onProperties}){
 const current=toolGroup(tab)?.id;
 function open(id){update(v=>rememberTool(v,id));onTool(id);}
 return <nav className="editor-tabs workspace-tool-navigation complete-tool-rail" aria-label="Editor tools">
  <button className="rail-search" title="Find tools · Ctrl/⌘ K" aria-label="Search tools and commands" onClick={onSearch}><StudioIcon name="search"/><span>Search</span></button>
  <span className="rail-separator" aria-hidden="true"/>
  {STUDIO_TOOLS.map(t=><button key={t.id} title={`${t.id} · ${t.hint}`} aria-label={t.id} aria-pressed={current===t.id} onClick={()=>open(t.id)}><span className="rail-icon"><StudioIcon name={t.icon}/></span><span className="rail-label">{t.id==='Creative Tools'?'Creative':t.id}</span><span className="rail-active-dot" aria-hidden="true"/></button>)}
  <button className="mobile-properties" aria-label="Selection properties" onClick={onProperties}><StudioIcon name="settings"/><span>Edit</span></button>
 </nav>;
}
