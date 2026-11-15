import {fitText} from '../templates/fitting.js';
import {newDesign,makeElement,validateDocument} from '../editor/document.js';
import {blankVideo} from './document.js';
import {videoTemplates} from './catalog.js';
export {videoTemplates} from './catalog.js';
export function generateVideoTemplate(id){const t=videoTemplates.find(t=>t.id===id);if(!t)throw Error('Unknown video template.');const doc={...newDesign(t.name,t.width,t.height),schemaVersion:2,video:blankVideo(t.duration)};doc.canvas.background='#1d2330';const w=t.width,h=t.height,s=w/1080,landscape=w>h;let n=0;const text=(value,x,y,bw,bh,font,color,start,end,animation='slide-in')=>{const fitted=fitText(value,{width:bw*.97,height:bh*.95},{font:t.style==='Editorial'||t.style==='Minimalist'?'Georgia':'Arial',weight:'bold',max:font,min:12,lineHeight:1.05});if(fitted.overflow)throw Error('Video template text does not fit.');doc.elements.push({...makeElement('text',`video-text-${++n}`),text:fitted.text,x,y,width:bw,height:bh,fontSize:fitted.fontSize,fontFamily:t.style==='Editorial'||t.style==='Minimalist'?'Georgia':'Arial',fill:color,fontWeight:'bold',lineHeight:1.05,timing:{start,end},animation:{type:animation,duration:.65,delay:.1}});};
 doc.elements.push({...makeElement('ellipse','video-orbit'),x:w*.65,y:h*.1,width:w*.6,height:w*.6,fill:t.accent,opacity:.16,animation:{type:'pulse',duration:t.duration,delay:0}});
 if(t.id==='video-birthday')for(let i=0;i<12;i++)doc.elements.push({...makeElement('ellipse',`confetti-${i}`),x:(i*137)%w,y:(i*293)%h,width:20+(i%3)*15,height:20+(i%3)*15,fill:i%2?t.accent:'#eddc8c',animation:{type:'bounce',duration:2+i*.2,delay:i*.08},opacity:.7});
 text('COMVEXA / ALDER STUDIO',w*.08,h*.07,w*.84,h*.06,24*s,t.accent,0,t.duration,'fade-in');
 const scene=t.duration/3;
 text(t.title,w*.08,h*(landscape?.24:.26),w*.84,h*.44,(landscape?76:110)*s,'#ffffff',0,scene);
 doc.elements.push({...makeElement('rect','scene-two-panel'),x:0,y:h*.18,width:w,height:h*.67,fill:t.accent,cornerRadius:0,timing:{start:scene,end:scene*2},animation:{type:'fade-in',duration:.4,delay:0}});
 text(t.middle,w*.08,h*(landscape?.25:.3),w*.84,h*.5,(landscape?70:100)*s,'#1d2330',scene,scene*2,'pop');
 text(t.closing,w*.08,h*.35,w*.84,h*.4,(landscape?58:70)*s,'#ffffff',scene*2,t.duration,'scale-in');
 text('CREATE ONCE. USE EVERYWHERE.',w*.08,h*.89,w*.84,h*.06,19*s,t.accent,0,t.duration,'fade-in');
 return validateDocument(doc);}
