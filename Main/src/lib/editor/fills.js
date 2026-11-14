const patterns=new Map();
export const FILL_PRESETS=[
 {name:'Aurora',kind:'linear',colors:['#6038d7','#db67aa','#f5c585'],angle:35},
 {name:'Coast',kind:'linear',colors:['#133f60','#3a9baf','#d1eee2'],angle:120},
 {name:'Sunlit',kind:'radial',colors:['#fff0bf','#e99e8e','#8c5697'],angle:0},
 {name:'Midnight',kind:'linear',colors:['#151a35','#3d3b76'],angle:90},
 {name:'Dot paper',kind:'dots',colors:['#f7f4ed','#a6a9b2'],angle:0},
 {name:'Fine stripe',kind:'stripes',colors:['#eef0f8','#b0b9d3'],angle:45},
 {name:'Crosshatch',kind:'crosshatch',colors:['#f2e9da','#c2b39a'],angle:0},
 {name:'Soft grain',kind:'paper',colors:['#f7f2e7','#c8bda8'],angle:0},
];
function pattern(fill){const key=JSON.stringify(fill);if(patterns.has(key))return patterns.get(key);const c=document.createElement('canvas'),s=fill.spacing;c.width=c.height=s;const x=c.getContext('2d');x.fillStyle=fill.colors[0];x.fillRect(0,0,s,s);x.fillStyle=x.strokeStyle=fill.colors[1];x.globalAlpha=fill.opacity;x.lineWidth=1;
 if(fill.kind==='dots'){x.beginPath();x.arc(s/2,s/2,1.2,0,Math.PI*2);x.fill();}
 else if(fill.kind==='paper'){for(let i=0;i<60;i++){const a=(i*17.13)%s,b=(i*31.77)%s;x.globalAlpha=fill.opacity*(.08+(i%4)*.04);x.fillRect(a,b,1,1);}}
 else{ x.beginPath();x.moveTo(0,.5);x.lineTo(s,.5);if(fill.kind==='crosshatch'){x.moveTo(.5,0);x.lineTo(.5,s);}x.stroke();}
 if(patterns.size>32)patterns.delete(patterns.keys().next().value);patterns.set(key,c);return c;}
export function fillAttributes(e){const f=e.fillEffect;if(!f)return{};const stops=f.colors.flatMap((color,i)=>[i/(f.colors.length-1),color]);
 if(!['linear','radial'].includes(f.kind))return{fillPriority:'pattern',fillPatternImage:pattern(f),fillPatternRepeat:'repeat',fillPatternRotation:f.angle};
 const rad=f.angle*Math.PI/180,r=(Math.abs(Math.cos(rad))*e.width+Math.abs(Math.sin(rad))*e.height)/2,dx=Math.cos(rad)*r,dy=Math.sin(rad)*r;
 // Alpha stops keep gradient opacity identical in canvas and static exports.
 const alpha=color=>color+Math.round(f.opacity*255).toString(16).padStart(2,'0');
 return f.kind==='radial'?{fillPriority:'radial-gradient',fillRadialGradientStartPoint:{x:e.width/2,y:e.height/2},fillRadialGradientEndPoint:{x:e.width/2,y:e.height/2},fillRadialGradientStartRadius:0,fillRadialGradientEndRadius:Math.max(e.width,e.height)*.7,fillRadialGradientColorStops:stops.map((v,i)=>i%2?alpha(v):v)}:{fillPriority:'linear-gradient',fillLinearGradientStartPoint:{x:e.width/2-dx,y:e.height/2-dy},fillLinearGradientEndPoint:{x:e.width/2+dx,y:e.height/2+dy},fillLinearGradientColorStops:stops.map((v,i)=>i%2?alpha(v):v)};}
