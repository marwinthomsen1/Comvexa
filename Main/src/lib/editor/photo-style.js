import {photoFilters,photoEffects} from '../creative/photos.js';
export const PHOTO_DEFAULTS={brightness:0,contrast:0,saturation:0,warmth:0};
export const ADVANCED_PHOTO_DEFAULTS={exposure:0,highlights:0,shadows:0,tint:0,sharpness:0,blur:0,vignette:0};
export function validatePhotoStyle(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid photo adjustment.');
 const out={...PHOTO_DEFAULTS};
 for(const [k,v] of Object.entries(value)){
  if(k==='filter'||k==='effect'){if(typeof v!=='string'||(v!==''&&!(k==='filter'?photoFilters:photoEffects).some(p=>p.id===v)))throw Error('Unknown photo look.');}
  else if(k==='filterIntensity'||k==='effectIntensity'){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)throw Error('Invalid photo intensity.');}
  else if(!Object.hasOwn({...PHOTO_DEFAULTS,...ADVANCED_PHOTO_DEFAULTS},k)||typeof v!=='number'||!Number.isFinite(v)||v< -100||v>100||(['blur','sharpness','vignette'].includes(k)&&v<0))throw Error('Invalid photo adjustment.');
  out[k]=v;
 }return out;
}
export const photoPresets=[{name:'Original',style:PHOTO_DEFAULTS},{name:'Vivid',style:{brightness:4,contrast:18,saturation:25,warmth:0}},{name:'Warm',style:{brightness:3,contrast:5,saturation:5,warmth:28}},{name:'Black & white',style:{brightness:0,contrast:12,saturation:-100,warmth:0}},{name:'Vintage',style:{brightness:8,contrast:-12,saturation:-25,warmth:18}}];
const clamp=v=>Math.max(0,Math.min(255,v));
export function adjustPhotoPixels(pixels,style){const s=validatePhotoStyle(style),light=s.brightness*2.55,contrast=(100+s.contrast)/100,sat=(100+s.saturation)/100,warm=s.warmth*.35,exp=2**((s.exposure||0)/50),tint=(s.tint||0)*.3,f=photoFilters.find(f=>f.id===s.filter),mix=(s.filterIntensity??100)/100;
 for(let i=0;i<pixels.length;i+=4){const raw=[pixels[i],pixels[i+1],pixels[i+2]],lum=.2126*raw[0]+.7152*raw[1]+.0722*raw[2],tonal=(s.shadows||0)*(1-lum/255)**2*.8+(s.highlights||0)*(lum/255)**2*.8;
 let r=(raw[0]*exp-128)*contrast+128+light+warm+tonal+tint/2,g=(raw[1]*exp-128)*contrast+128+light+tonal-tint,b=(raw[2]*exp-128)*contrast+128+light-warm+tonal+tint/2;const l=.2126*r+.7152*g+.0722*b;r=l+(r-l)*sat;g=l+(g-l)*sat;b=l+(b-l)*sat;
 if(f){const values=[r,g,b],gray=.2126*r+.7152*g+.0722*b;[r,g,b]=values.map((v,c)=>{let n=gray+(v-gray)*f.saturation;n=(n-128)*f.contrast+128+f.lift+([f.temperature,-f.tint,-f.temperature][c]);n=255*(clamp(n)/255)**f.gamma;const weight=clamp(gray)/255;n+=f.shadows[c]*(1-weight)+f.highlights[c]*weight;return v+(n-v)*mix;});}
 pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;
 }return pixels;
}
