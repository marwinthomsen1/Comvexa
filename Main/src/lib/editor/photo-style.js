export const PHOTO_DEFAULTS={brightness:0,contrast:0,saturation:0,warmth:0};
export function validatePhotoStyle(value){
 if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(PHOTO_DEFAULTS,k)))throw new Error("Invalid photo adjustment.");
 const style={...PHOTO_DEFAULTS,...value};for(const n of Object.values(style))if(typeof n!=="number"||!Number.isFinite(n)||n< -100||n>100)throw new Error("Photo adjustments must be between -100 and 100.");return style;
}
export const photoPresets=[{name:"Original",style:PHOTO_DEFAULTS},{name:"Vivid",style:{brightness:4,contrast:18,saturation:25,warmth:0}},{name:"Warm",style:{brightness:3,contrast:5,saturation:5,warmth:28}},{name:"Black & white",style:{brightness:0,contrast:12,saturation:-100,warmth:0}},{name:"Vintage",style:{brightness:8,contrast:-12,saturation:-25,warmth:18}}];
// Shared native pixel pipeline for preview and export. Never runs during transforms.
export function adjustPhotoPixels(pixels,style){const s=validatePhotoStyle(style),light=s.brightness*2.55,contrast=(100+s.contrast)/100,sat=(100+s.saturation)/100,warm=s.warmth*.35;
 for(let i=0;i<pixels.length;i+=4){let r=(pixels[i]-128)*contrast+128+light+warm,g=(pixels[i+1]-128)*contrast+128+light,b=(pixels[i+2]-128)*contrast+128+light-warm;const l=.2126*r+.7152*g+.0722*b;pixels[i]=l+(r-l)*sat;pixels[i+1]=l+(g-l)*sat;pixels[i+2]=l+(b-l)*sat;}return pixels;
}
