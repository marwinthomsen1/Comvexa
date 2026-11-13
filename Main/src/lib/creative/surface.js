import {photoEffects} from './photos.js';
const copy=canvas=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;c.getContext('2d').drawImage(canvas,0,0);return c;};
export function applyPhotoSurface(canvas,s){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,size=Math.min(w,h),effect=photoEffects.find(e=>e.id===s.effect),intensity=(s.effectIntensity??60)/100;
 if(s.sharpness){const p=ctx.getImageData(0,0,w,h),original=p.data.slice(),a=s.sharpness/100*.75;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)for(let c=0;c<3;c++){const i=(y*w+x)*4+c;p.data[i]=original[i]*(1+4*a)-a*(original[i-4]+original[i+4]+original[i-w*4]+original[i+w*4]);}ctx.putImageData(p,0,0);}
 function blur(amount,alpha=1){const c=copy(canvas);ctx.save();ctx.globalAlpha=alpha;ctx.filter=`blur(${amount}px)`;ctx.drawImage(c,0,0);ctx.restore();c.width=0;c.height=0;}
 if(s.blur)blur(s.blur/100*size*.035);
 if(effect&&intensity>0){const e=effect;ctx.save();ctx.globalAlpha=intensity;ctx.globalCompositeOperation='source-atop';
 if(['grain','noise','paper','weave','dots','lines','scratches','dust','duotone','chromatic'].includes(e.kind)){
 const p=ctx.getImageData(0,0,w,h);let seed=4711;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const original=e.kind==='chromatic'?p.data.slice():null;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,l=.2126*p.data[i]+.7152*p.data[i+1]+.0722*p.data[i+2],scale=Math.max(1,size/600);let d=0;
 if(e.kind==='grain')d=(random()-.5)*e.a*(e.scale===3?1+Math.sin(Math.floor(x/3)+Math.floor(y/3)):1);
 if(e.kind==='noise')d=(random()-.5)*e.a;
 if(e.kind==='paper')d=(random()-.5)*14+Math.sin(x/scale*.7)*Math.cos(y/scale*.9)*7;
 if(e.kind==='weave')d=((Math.floor(x/scale)%e.scale===0?1:0)+(Math.floor(y/scale)%e.scale===0?1:0)-.5)*e.a;
 if(e.kind==='lines')d=Math.floor(y/scale)%e.scale===0?-e.a:3;
 if(e.kind==='dots'){const step=e.scale*scale,dx=x%step-step/2,dy=y%step-step/2;d=Math.hypot(dx,dy)<step*(1-l/255)*.5?-90:16;}
 if(e.kind==='scratches')d=Math.sin(Math.floor(x/scale)*71.3)>.996?80:0;
 if(e.kind==='dust')d=random()>.998?100:0;
 for(let c=0;c<3;c++){let v=p.data[i+c]+d;if(e.kind==='noise')v=p.data[i+c]+(random()-.5)*e.a;if(e.kind==='duotone')v=[28,20,75][c]*(1-l/255)+[253,183,149][c]*(l/255);if(original){const shift=Math.round(4*scale)*(c===0?1:c===2?-1:0),sx=Math.max(0,Math.min(w-1,x+shift));v=original[(y*w+sx)*4+c];}p.data[i+c]+=(v-p.data[i+c])*intensity;}}
 ctx.putImageData(p,0,0);
 }else if(e.kind==='soft'||e.kind==='glow'){ctx.restore();blur(size*.012,intensity*(e.kind==='glow'?.5:1));if(e.kind==='glow'){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=intensity*.15;ctx.fillStyle=e.b?'#ffbd70':'#ffffff';ctx.fillRect(0,0,w,h);ctx.restore();}ctx.save();
 }else if(e.kind==='bokeh'){const colors=['#ffe6a0','#ffc5e5','#b9eaff'];for(let i=0;i<24;i++){const x=((i*137.51)%997)/997*w,y=((i*i*71.3)%991)/991*h,r=size*(.018+(i%5)*.009);const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,colors[e.a]+'aa');g.addColorStop(.7,colors[e.a]+'55');g.addColorStop(1,colors[e.a]+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}}
 else{let g;if(e.kind==='vignette'){g=ctx.createRadialGradient(w/2,h/2,size*.16,w/2,h/2,Math.hypot(w,h)*.55);g.addColorStop(0,'#00000000');g.addColorStop(1,e.b?'#ffffff':'#000000');}
 else if(e.kind==='leak'||e.kind==='flare'){const colors=['#ff8a25','#ff4cbd','#29bbff'];g=ctx.createRadialGradient(e.kind==='flare'?w*.7:w*.02,h*.1,0,w*.1,h*.2,w*.9);g.addColorStop(0,e.kind==='flare'?'#ffffff':colors[e.a]);g.addColorStop(.3,colors[e.a]+'77');g.addColorStop(1,colors[e.a]+'00');}
 else if(e.kind==='wash'){ctx.fillStyle=['#f565a2','#129bc4','#ffb94a'][e.a];ctx.globalAlpha=intensity*.4;}
 else{g=ctx.createLinearGradient(0,0,w,h);const colors=e.kind==='holo'?['#86fff9','#ff8be4','#c4a5ff','#ffe7a0','#65e8e3']:e.kind==='prism'?['#ff547b00','#ffc26588','#7bdcff99','#d577ff00']:e.a===1?['#081968','#a73bd9']:['#ff9e42','#ff498b','#7146c6'];colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));ctx.globalAlpha=intensity*.45;}
 if(g)ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 ctx.restore();}
 if(s.vignette){ctx.save();ctx.globalCompositeOperation='source-atop';const g=ctx.createRadialGradient(w/2,h/2,size*.2,w/2,h/2,Math.hypot(w,h)*.55);g.addColorStop(0,'#00000000');g.addColorStop(1,`rgba(0,0,0,${s.vignette/100})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore();}
 return canvas;
}
