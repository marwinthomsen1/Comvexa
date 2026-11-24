"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

// Only observe decorative containers; never change canvas playback or editing.
export function MotionBudget(){
 const pathname=usePathname();
 useEffect(()=>{
  const root=document.documentElement;
  const visibility=()=>root.classList.toggle('page-idle',document.hidden);
  visibility();document.addEventListener('visibilitychange',visibility);
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{for(const entry of entries)entry.target.dataset.motionVisible=String(entry.isIntersecting);},{rootMargin:'80px'});
  const nodes=document.querySelectorAll('.dashboard-hero, .library-hero, .curated-heading, .campaigns-hero, .sidebar-inspiration, .package-format-art');
  nodes.forEach(node=>observer?.observe(node));
  return()=>{observer?.disconnect();document.removeEventListener('visibilitychange',visibility);root.classList.remove('page-idle');nodes.forEach(node=>delete node.dataset.motionVisible);};
 },[pathname]);
 return null;
}
