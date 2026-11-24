import {makeElement,validateDocument} from '../editor/document.js';
import {editableIds,bounds,moveSelection} from '../editor/selection.js';
export const finishingTools=[
 ['sentence','type','Sentence case','Make sentences read naturally','Text'],['bullets','type','Bullet list','Turn lines into a tidy list','Text'],['numbered','type','Numbered list','Give every step a number','Text'],['dedupe','type','Remove duplicate lines','Keep each line only once','Text'],['reverse-lines','type','Reverse lines','Flip the order of a list','Text'],['sort-lines','type','Sort lines A–Z','Organize your text alphabetically','Text'],['prefix','type','Add line prefix','Add a label to every line','Text'],['suffix','type','Add line suffix','Finish each line consistently','Text'],
 ['page-center','grid','Center on page','Place your selection in the middle','Selection'],['page-left','grid','Align to left edge','Snap selection to page left','Selection'],['page-right','grid','Align to right edge','Snap selection to page right','Selection'],['page-top','grid','Align to top edge','Snap selection to page top','Selection'],['page-bottom','grid','Align to bottom edge','Snap selection to page bottom','Selection'],['equal-width','layers','Match widths','Make selected objects equally wide','Selection'],['equal-height','layers','Match heights','Make selected objects equally tall','Selection'],
 ['gradient','palette','Gradient background','Blend two colors across the page','Design'],['border','square','Page border','Frame the page with an editable border','Design'],['divider','shapes','Divider line','Add a clean editable separator','Design'],['pill','shapes','Pill badge','Create a rounded label shape','Design'],['label','type','Caption label','Add a small editable caption','Design'],['watermark','type','Text watermark','Add subtle ownership text','Design'],['dots','shapes','Dot pattern','Build a playful page background','Design'],['stripes','shapes','Stripe pattern','Give your page a graphic rhythm','Design'],['progress','layers','Progress bar','Create an editable progress graphic','Design'],['replace-color','palette','Replace a color','Swap matching colors on this page','Design']
].map(([id,icon,name,description,requires])=>({id:'finish-'+id,action:id,icon,name,description,requires}));
export function finishDocument(doc,tool,ids,options={},idFactory=()=>crypto.randomUUID()){
 const spec=finishingTools.find(t=>t.id===tool);if(!spec)throw Error('Unknown finishing tool.');
 const {action:a}=spec,targets=editableIds(doc,ids),selected=doc.elements.filter(e=>targets.includes(e.id));
 const color=options.color||'#9663cf',second=options.second||'#f5e9da',text=String(options.text??'Made with Comvexa').slice(0,200),amount=Math.max(0,Math.min(100,Number(options.amount??50)));
 if(!/^#[0-9a-f]{6}$/i.test(color)||!/^#[0-9a-f]{6}$/i.test(second))throw Error('Choose valid colors.');
 let next={...doc,schemaVersion:doc.pages?3:2};const patch=fn=>{next.elements=doc.elements.map(e=>targets.includes(e.id)?{...e,...fn(e),...(e.binding?{localOverride:true}:{})}:e);};
 if(spec.requires==='Text'){
  const texts=selected.filter(e=>e.type==='text');if(!texts.length)throw Error('Choose at least one unlocked text layer.');
  patch(e=>{if(e.type!=='text')return {};let t=e.text,lines=t.split('\n');if(a==='sentence')t=t.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu,(_,p,c)=>p+c.toUpperCase());if(a==='bullets')t=lines.map(l=>l.trim()?`• ${l.replace(/^\s*(?:[•-]|\d+[.)])\s*/, '')}`:'').join('\n');if(a==='numbered'){let i=0;t=lines.map(l=>l.trim()?`${++i}. ${l.replace(/^\s*(?:[•-]|\d+[.)])\s*/,'')}`:'').join('\n');}if(a==='dedupe')t=[...new Set(lines)].join('\n');if(a==='reverse-lines')t=lines.reverse().join('\n');if(a==='sort-lines')t=lines.sort((x,y)=>x.localeCompare(y)).join('\n');if(a==='prefix')t=lines.map(l=>text+l).join('\n');if(a==='suffix')t=lines.map(l=>l+text).join('\n');return {text:t};});
 }else if(spec.requires==='Selection'){
  if(!selected.length)throw Error('Select unlocked objects first.');
  if(a.startsWith('page-')){const box=bounds(selected),w=doc.canvas.width,h=doc.canvas.height;let dx=0,dy=0;if(a==='page-center'){dx=(w-box.width)/2-box.x;dy=(h-box.height)/2-box.y;}if(a==='page-left')dx=-box.x;if(a==='page-right')dx=w-box.width-box.x;if(a==='page-top')dy=-box.y;if(a==='page-bottom')dy=h-box.height-box.y;return validateDocument(moveSelection(doc,targets,dx,dy));}
  if(selected.length<2)throw Error('Select at least two objects to match their size.');const key=a==='equal-width'?'width':'height',size=selected[0][key];patch(()=>({[key]:size}));
 }else if(['gradient','dots','stripes'].includes(a)){next.canvas={...doc.canvas,transparent:false,background:color,fillEffect:{kind:a==='gradient'?'linear':a,colors:[color,second],angle:a==='gradient'?amount*3.6:45,opacity:1,spacing:Math.max(8,amount*2)}};
 }else if(a==='replace-color'){const swap=v=>typeof v==='string'&&v.toLowerCase()===color.toLowerCase()?second:v;next.canvas={...doc.canvas,background:swap(doc.canvas.background),...(doc.canvas.fillEffect?{fillEffect:{...doc.canvas.fillEffect,colors:doc.canvas.fillEffect.colors.map(swap)}}:{})};next.elements=doc.elements.map(e=>e.locked?e:{...e,...(e.fill?{fill:swap(e.fill)}:{}),...(e.stroke?{stroke:swap(e.stroke)}:{}),...(e.fillEffect?{fillEffect:{...e.fillEffect,colors:e.fillEffect.colors.map(swap)}}:{}),...(e.binding?{localOverride:true}:{})});
 }else{
  const w=doc.canvas.width,h=doc.canvas.height,s=Math.min(w,h),shape=(type,props)=>({...makeElement(type,idFactory()),...props}),add=[];
  if(a==='border'){// Four native strips keep the page interior transparent.
   add.length=0;const m=s*.04,t=Math.max(1,s*.004);for(const p of [{x:m,y:m,width:w-2*m,height:t},{x:m,y:h-m-t,width:w-2*m,height:t},{x:m,y:m,width:t,height:h-2*m},{x:w-m-t,y:m,width:t,height:h-2*m}])add.push(shape('rect',{...p,fill:color,cornerRadius:0}));
  }
  if(a==='divider')add.push(shape('rect',{x:w*.15,y:h*.5,width:w*.7,height:Math.max(2,s*.004),fill:color,cornerRadius:0}));
  if(a==='pill')add.push(shape('rect',{x:w*.3,y:h*.45,width:w*.4,height:h*.09,cornerRadius:s*.045,fill:color}));
  if(a==='label'||a==='watermark')add.push(shape('text',{x:w*.1,y:a==='watermark'?h*.86:h*.45,width:w*.8,height:h*.09,text,fontSize:Math.max(6,Math.min(600,s*(a==='watermark'?.025:.035))),align:'center',fill:color,opacity:a==='watermark'?.3:1,fontWeight:'normal'}));
  if(a==='progress'){const x=w*.15,y=h*.48,bw=w*.7,bh=Math.max(6,h*.035),groupId=idFactory();add.push(shape('rect',{x,y,width:bw,height:bh,fill:second,cornerRadius:bh/2,groupId}));if(amount>0)add.push(shape('rect',{x,y,width:bw*amount/100,height:bh,fill:color,cornerRadius:bh/2,groupId}));}
  next.elements=[...doc.elements,...add];
 }
 return validateDocument(next);
}
