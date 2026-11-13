const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function moveCrop(crop,dx,dy){return {...crop,x:clamp(crop.x+dx,0,1-crop.width),y:clamp(crop.y+dy,0,1-crop.height)};}
// Opposite corner remains fixed; ratio is normalized width / height (source-aware).
export function resizeCrop(crop,corner,dx,dy,ratio=null){
 const left=corner.includes("w"),top=corner.includes("n"),anchorX=left?crop.x+crop.width:crop.x,anchorY=top?crop.y+crop.height:crop.y;
 const maxW=left?anchorX:1-anchorX,maxH=top?anchorY:1-anchorY;
 let width=clamp(crop.width+(left?-dx:dx),.01,maxW),height=clamp(crop.height+(top?-dy:dy),.01,maxH);
 if(ratio){const lower=Math.max(.01,.01*ratio),upper=Math.min(maxW,maxH*ratio);if(lower>upper)return {...crop};width=clamp(Math.min(width,height*ratio),lower,upper);height=width/ratio;}
 return {x:left?anchorX-width:anchorX,y:top?anchorY-height:anchorY,width,height};
}
export function sourceDelta(dx,dy,rotation,displayWidth,displayHeight){const r=-rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return {x:(dx*c-dy*s)/displayWidth,y:(dx*s+dy*c)/displayHeight};}
