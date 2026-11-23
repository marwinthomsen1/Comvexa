import {pageSnapshots} from './pages.js';
import {documentWarnings,approximateMeasure} from '../templates/fitting.js';
export function contrastRatio(a,b){
 const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 if(!/^#[a-f\d]{6}$/i.test(a)||!/^#[a-f\d]{6}$/i.test(b))return null;
 const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function bounds(e){const angle=e.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);const corners=[[0,0],[e.width,0],[e.width,e.height],[0,e.height]].map(([x,y])=>[e.x+x*c-y*s,e.y+x*s+y*c]);return{left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),bottom:Math.max(...corners.map(p=>p[1]))};}
export function designQuality(doc,{print=false,measure=approximateMeasure}={}){
 const issues=[];
 for(const [index,page] of pageSnapshots(doc).entries()){
  const add=(element,code,message)=>issues.push({pageId:page.id,page:index+1,elementId:element.id,code,message});
  const visible=page.elements.filter(e=>!e.hidden&&e.opacity>0);
  for(const e of visible){
   const b=bounds(e),w=page.canvas.width,h=page.canvas.height;
   if(e.type==='text'){
    if(documentWarnings({elements:[e]},measure).length)add(e,'overflow','Text may be clipped. Enlarge its frame or reduce the font size.');
    if(b.left<-.5||b.top<-.5||b.right>w+.5||b.bottom>h+.5)add(e,'outside','Text extends beyond the canvas. Move it inside the page.');
    // Only assess a solid, opaque background we can identify; photos/gradients are not guessed.
    let background=page.canvas.background,known=!page.canvas.fillEffect&&!page.canvas.transparent;
    for(const lower of visible.slice(0,visible.indexOf(e))){const lb=bounds(lower);if(lb.right<=b.left||lb.left>=b.right||lb.bottom<=b.top||lb.top>=b.bottom)continue;
     if(lower.type==='rect'&&!lower.rotation&&!lower.cornerRadius&&!lower.graphicId&&!lower.drawing&&!lower.blendMode&&!lower.fillEffect&&lower.opacity===1&&lb.left<=b.left&&lb.top<=b.top&&lb.right>=b.right&&lb.bottom>=b.bottom){background=lower.fill;known=true;}else known=false;
    }
    if(known&&e.opacity===1&&(!e.textStyle?.effect||e.textStyle.effect==='none')){const ratio=contrastRatio(e.fill,background),threshold=e.fontSize>=24||(e.fontSize>=18.66&&e.fontWeight==='bold')?3:4.5;if(ratio!==null&&ratio<threshold)add(e,'contrast',`Text contrast is ${ratio.toFixed(1)}:1 against its solid background. Try darker text or a lighter background.`);}
    const margin=Math.min(w,h)*.03;
    if(print&&(b.left<margin||b.top<margin||b.right>w-margin||b.bottom>h-margin))add(e,'print-margin','Text is within the outer 3% of the page. Move it inward and confirm the printer’s trim requirements.');
   }
   if(e.type==='image'){
    const asset=doc.assets[e.assetId];
    if(!asset)add(e,'missing-image','Image source is missing. Replace the photo.');
    else{const cw=asset.width*(e.crop?.width??1),ch=asset.height*(e.crop?.height??1),scale=Math.min(cw/e.width,ch/e.height);if(scale<(print?1:.75))add(e,'resolution',`Photo has about ${Math.round(scale*100)}% of the pixels needed at this size. Use a larger source or make the photo smaller.`);}
   }
  }
 }
 return issues;
}
