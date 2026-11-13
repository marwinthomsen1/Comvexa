"use client";
/* Cached local blob previews cannot use the Next image optimizer. */
/* eslint-disable @next/next/no-img-element */
import {useEffect,useRef,useState} from 'react';
import {pageDocuments} from '@/lib/editor/pages';
import {designStore} from '@/lib/editor/store';
import {previewCache} from '@/lib/editor/library';
let queue=Promise.resolve();
export default function DesignThumbnail({item}){
 const root=useRef(null),[src,setSrc]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true,url;setSrc('');setFailed(false);
 const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();
 queue=queue.catch(()=>{}).then(async()=>{if(!active)return;try{
 let cached=await previewCache.get(item.id);
 if(cached?.revision!==item.revision){const record=await designStore.load(item.id);if(!record)throw Error('Missing design');const {renderExport}=await import('@/lib/editor/export');const blob=await renderExport(pageDocuments(record.document)[0],'png',undefined,480);cached={id:item.id,revision:record.revision,blob};await previewCache.put(cached);}
 if(active){url=URL.createObjectURL(cached.blob);setSrc(url);}
 }catch{if(active)setFailed(true);}});
 },{rootMargin:'160px'});observer.observe(root.current);
 return()=>{active=false;observer.disconnect();if(url)URL.revokeObjectURL(url);};
 },[item.id,item.revision]);
 return <div ref={root} className="saved-artwork">{src?<img src={src} alt={`${item.name} preview`}/>:<span className="thumbnail-fallback"><strong>{item.name.slice(0,1)}</strong><small>{failed?'Preview unavailable':'Preparing preview…'}</small></span>}</div>;
}
