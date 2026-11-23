// Original vector artwork. Deterministic paths, editable placement, no external SVG.
const colors=['#6146c6','#ea688d','#1c8878','#e9ab32','#3185be'],items=[];
const path=(d,c,stroke=false,w=4)=>`<path d="${d}" fill="${stroke?'none':c}"${stroke?` stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
function add(category,name,art){items.push({id:'illustration-'+items.length,name,category,keywords:`${category} ${name}`,art});}
const words=['THANK YOU','NEW ARRIVAL','LIMITED EDITION','HANDMADE','JUST FOR YOU','BEST SELLER','SAVE THE DATE','GOOD THINGS','LOCAL LOVE','FRESH DAILY','SMALL BATCH','YOU ARE INVITED','OPEN HOUSE','MADE TO LAST','LET’S CELEBRATE','COMING SOON','STAY CURIOUS','KEEP GROWING','DREAM MORE','HELLO WEEKEND'];
for(let i=0;i<20;i++){const c=colors[i%5],points=Array.from({length:24},(_,k)=>{const r=k%2?38:47,a=k*Math.PI/12;return `${50+r*Math.cos(a)},${50+r*Math.sin(a)}`;}).join(' ');const lines=words[i].split(' '),size=lines.some(w=>w.length>8)?10:13;
add('Labels',words[i],`<polygon points="${points}" fill="${c}"/>`+circle(50,50,33,'#fff9e9')+lines.map((word,k)=>`<text x="50" y="${50-(lines.length-1)*8+k*16}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${size}" font-weight="bold" fill="${c}">${word.replaceAll('&','&amp;')}</text>`).join(''));
add('Ribbons',words[i]+' ribbon',path('M3 24H97L86 50L97 76H3L14 50Z',c)+lines.map((word,k)=>`<text x="50" y="${46-(lines.length-1)*5+k*13}" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#ffffff">${word}</text>`).join(''));
const branches=Array.from({length:4+i%4},(_,j)=>{const y=22+j*9,x=50+(j%2?1:-1)*(15+i%5);return path(`M50 ${y+10}Q${x} ${y-12} ${x} ${y+1}Q${x} ${y+11} 50 ${y+10}Z`,j%2?c:'#91bc7a');}).join('');
add('Botanical','Botanical sprig '+(i+1),path(`M50 94Q${40+i} 55 50 12`,c,true,3)+branches);
const petals=5+i%8;add('Botanical','Garden bloom '+(i+1),path('M50 92V50','#408c64',true,4)+Array.from({length:petals},(_,j)=>{const a=j*2*Math.PI/petals;return `<ellipse cx="${50+20*Math.cos(a)}" cy="${41+20*Math.sin(a)}" rx="${8+i%4}" ry="17" transform="rotate(${a*180/Math.PI} ${50+20*Math.cos(a)} ${41+20*Math.sin(a)})" fill="${c}"/>`;}).join('')+circle(50,41,10,'#ffce69'));
const n=4+i,r=20+i%8;add('Celestial','Radiant sun '+(i+1),circle(50,50,r,c)+Array.from({length:n},(_,j)=>{const a=j*2*Math.PI/n;return path(`M${50+(r+7)*Math.cos(a)} ${50+(r+7)*Math.sin(a)}L${50+45*Math.cos(a)} ${50+45*Math.sin(a)}`,c,true,3);}).join(''));
const stars=Array.from({length:3+i%5},(_,j)=>{const x=12+(j*29+i*7)%77,y=14+(j*19+i*5)%70;return path(`M${x} ${y-6}L${x+2} ${y-2}L${x+7} ${y}L${x+2} ${y+2}L${x} ${y+7}L${x-2} ${y+2}L${x-7} ${y}L${x-2} ${y-2}Z`,colors[(i+j)%5]);}).join('');add('Celestial','Little constellation '+(i+1),stars);
add('Arrows','Hand-drawn arrow '+(i+1),path(`M8 ${25+i*2}Q${25+i} ${95-i*3} 88 ${30+i}M${65+i%10} ${24+i}L88 ${30+i}L${80-i%9} ${52+i}`,c,true,4+i%3));
add('Doodles','Confetti dance '+(i+1),Array.from({length:9},(_,j)=>{const x=8+(j*23+i*7)%80,y=10+(j*31+i*3)%75;return j%2?circle(x,y,3+j%4,colors[(j+i)%5]):path(`M${x} ${y}l${6+i%6} ${5+j%6}`,colors[(j+i)%5],true,4);}).join(''));
add('Frames','Scalloped frame '+(i+1),path(`M15 15Q${30+i} ${-4+i%9} 50 15Q${70-i} ${-4+i%9} 85 15Q${104-i%7} 35 85 50Q${104-i%7} 70 85 85Q65 ${104-i%7} 50 85Q35 ${104-i%7} 15 85Q${-4+i%7} 65 15 50Q${-4+i%7} 35 15 15Z`,c,true,3+i%3));
add('Patterns','Woven rhythm '+(i+1),Array.from({length:5+i%4},(_,j)=>path(`M8 ${10+j*10}Q${25+i} ${35+j*10} 50 ${10+j*10}T92 ${10+j*10}`,colors[(i+j)%5],true,3)).join(''));
}
export const extraStickers=items;
