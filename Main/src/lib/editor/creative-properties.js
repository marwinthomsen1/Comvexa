// Bounded, application-owned data only: no scripts, remote URLs or arbitrary SVG.
export const BRUSHES=['pen','pencil','marker','highlighter','brush','line'];
export const BLEND_MODES=['source-over','multiply','screen','overlay','darken','lighten'];
export const ANIMATIONS=['fade-in','fade-out','slide-in','slide-out','scale-in','pop','rotate','bounce','pulse'];
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
export function validateDrawing(v){if(!v||!BRUSHES.includes(v.brush)||!finite(v.weight,.00001,10)||!Array.isArray(v.points)||v.points.length<1||v.points.length>4096||v.points.some(p=>!Array.isArray(p)||p.length!==3||!finite(p[0],0,1)||!finite(p[1],0,1)||!finite(p[2],.05,1)))throw Error('Invalid drawing stroke.');return {brush:v.brush,weight:v.weight,points:v.points.map(p=>[...p])};}
export function validateFill(v){if(!v||!['linear','radial','dots','stripes','crosshatch','paper'].includes(v.kind)||!Array.isArray(v.colors)||v.colors.length<2||v.colors.length>4||!v.colors.every(color)||!finite(v.angle,0,360)||!finite(v.opacity,0,1)||!finite(v.spacing,8,200))throw Error('Invalid fill effect.');return {kind:v.kind,colors:[...v.colors],angle:v.angle,opacity:v.opacity,spacing:v.spacing};}
export function validateAnimation(v,page=false){if(!v||!(page?['fade','slide','zoom']:ANIMATIONS).includes(v.type)||!finite(v.duration,.1,10)||!finite(v.delay,0,10))throw Error('Invalid motion settings.');return {type:v.type,duration:v.duration,delay:v.delay};}
export function validateBlend(v){if(!BLEND_MODES.includes(v))throw Error('Unsupported blend mode.');return v;}
