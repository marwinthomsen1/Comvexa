export function motionFrame(type,p){p=Math.min(1,Math.max(0,p));const ease=1-Math.pow(1-p,3),distance=1-ease;const frame={opacity:1,dx:0,dy:0,scale:1,rotation:0};
 if(type==='fade-in'||type==='fade')frame.opacity=ease;
 if(type==='fade-out')frame.opacity=1-ease;
 if(type==='slide-in'||type==='slide'){frame.dx=-100*distance;frame.opacity=ease;}
 if(type==='slide-out'){frame.dx=100*ease;frame.opacity=1-ease;}
 if(type==='scale-in'||type==='zoom'){frame.scale=.5+.5*ease;frame.opacity=ease;}
 if(type==='pop'){frame.scale=p===1?1:1-Math.pow(2,-8*p)*Math.cos(p*Math.PI*4);frame.opacity=Math.min(1,p*4);}
 if(type==='rotate'){frame.rotation=-180*distance;frame.opacity=ease;}
 if(type==='bounce')frame.dy=-Math.abs(Math.sin(p*Math.PI*3))*50*(1-p);
 if(type==='pulse')frame.scale=1+Math.sin(p*Math.PI*2)*.08;
 return frame;}
