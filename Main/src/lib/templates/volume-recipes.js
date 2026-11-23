import {briefs,volumeTemplates} from './volume-two.js';
import photos from '../creative/photo-library.json' with {type:'json'};
import {CURATED_SIZES} from './curated-catalog.js';
const palettes=[['#102c2c','#fff8e8','#d9ed8e','#294e49'],['#fff7e8','#3c241f','#c24d2f','#eed9c3'],['#182449','#f8f5eb','#e5b85c','#2d3b63'],['#f3e9f5','#35234d','#9160a9','#dfcbe6'],['#f9efdf','#133d38','#39816d','#dfebd1']];
export function volumeRecipe(id){const t=volumeTemplates.find(t=>t.id===id);if(!t)throw Error('Template not found.');const b=briefs.find(b=>b.slug===t.brief),H=1000*CURATED_SIZES[t.ratio].height/CURATED_SIZES[t.ratio].width,L=t.layout,margin=48+(b.index%4)*4,commands=[];
 const T=(v,x,y,w,h,size=56,font='sans',color='i',align='left',weight='bold')=>commands.push(['t',v,x,y,w,h,size,font,color,align,weight]);
 const R=(x,y,w,h,c='a',r=0)=>commands.push(['r',x,y,w,h,c,r]);
 const E=(x,y,w,h,c='a')=>commands.push(['e',x,y,w,h,c]);
 const pool=photos.filter(p=>p.category===b.photoCategory&&(b.slug!=='coffee'||p.name.includes('Coffee'))&&(b.slug!=='bakery'||/breakfast|pancake/i.test(p.name))),photo=(pool.length?pool:photos)[(L+b.index)% (pool.length||photos.length)];
 const P=(x,y,w,h)=>commands.push(['p',photo.id,x,y,w,h]);
 const footer=()=>{R(margin,H-108,1000-2*margin,2,'i');T(b.cta,margin,H-88,760,44,20);T('YOUR BRAND',margin,margin,880,32,20,'mono');};
 const title=(x,y,w,h,size=76,align='left')=>T(b.title,x,y,w,h,size,L%3===0?'serif':'sans','i',align);
 const body=(x,y,w,h,size=26,align='left')=>T(b.body,x,y,w,h,size,'sans','i',align,'normal');
 // These are 20 separate layouts; format and content are selected with the brief.
 switch(L){
 case 0:P(535,0,465,H);T('THE EVERYDAY EDIT',margin,margin,410,50,18,'mono');title(margin,H*.23,440,H*.36,78);body(margin,H*.64,420,H*.18);T(b.cta,margin,H-90,420,50,22);break;
 case 1:footer();P(margin,130,1000-2*margin,H*.43);title(margin,H*.43+160,900,H*.19,78);body(margin,H*.65+155,850,H*.13);break;
 case 2:footer();title(margin,130,900,H*.22,100);P(margin,H*.32,570,H*.5);R(650,H*.32,350-margin,H*.5,'s');body(680,H*.36,240,H*.25,30);break;
 case 3:footer();R(0,0,180,H,'s');title(220,160,700,H*.25,96);P(220,H*.38,700,H*.35);body(220,H*.76,700,H*.12,28);break;
 case 4:P(0,0,1000,H);R(margin,margin,650,H-2*margin,'b');title(margin+28,margin+25,590,H*.31,62);body(margin+28,H*.48,580,H*.18,22);T(b.cta,margin+28,H-115,580,45,20);break;
 case 5:footer();P(420,140,580-margin,H*.49);R(margin,H*.36,570,H*.32,'s');title(margin+24,H*.39,510,H*.24,75);body(margin,H*.75,880,H*.12,24);break;
 case 6:footer();P(margin,135,430,H*.32);P(520,195,430-margin,H*.32);title(margin,H*.43+160,890,H*.2,88);body(margin,H*.69+120,850,H*.12);break;
 case 7:footer();R(margin,140,900,H-280,'s',18);T('YOU ARE INVITED',margin+32,180,800,60,23,'mono');title(margin+32,H*.3,790,H*.25,90);body(margin+32,H*.61,760,H*.16,30);break;
 case 8:footer();P(margin,150,430,H*.42);title(530,150,400,H*.31,66);body(530,H*.41,400,H*.16,25);R(margin,H*.67,900,5,'a');T('A NEW PERSPECTIVE',margin,H*.74,850,80,40,'mono');break;
 case 9:P(0,0,1000,H);R(0,H*.52,1000,H*.48,'b');title(margin,H*.56,890,H*.20,84);body(margin,H*.78,890,H*.08,23);T(b.cta,margin,H-55,880,30,18);break;
 case 10:footer();E(530,130,400,400,'s');R(margin,170,70,H*.5,'a');title(170,170,720,H*.29,90);body(170,H*.53,700,H*.22,30);break;
 case 11:footer();T('WORDS TO LIVE BY',margin,140,900,50,20,'mono');title(margin,H*.29,900,H*.3,110);body(margin,H*.66,820,H*.15,28);R(760,150,170,16,'a');break;
 case 12:footer();R(margin,135,900,H-285,'s');E(400,180,200,200,'a');title(100,H*.34,800,H*.24,76,'center');body(120,H*.64,760,H*.13,26,'center');break;
 case 13:footer();R(margin,140,900,H*.51,'i');P(margin+16,156,868,H*.51-32);title(margin,H*.7,900,H*.13,76);body(margin,H*.84,900,H*.07,22);break;
 case 14:footer();title(margin,110,900,H*.18,72);P(margin,H*.4,900,H*.28);body(margin,H*.71,830,H*.11,24);break;
 case 15:footer();E(300,H*.12,400,400,'s');P(350,H*.12+50,300,300);title(margin,H*.56,880,H*.18,74,'center');body(margin,H*.77,880,H*.1,25,'center');break;
 case 16:footer();T('THE FEATURE',margin,135,900,45,24,'mono');P(margin,220,900,H*.32);title(margin,H*.32+260,540,H*.2,78);body(630,H*.32+260,300,H*.21,24);break;
 case 17:footer();P(500,0,500,H-160);R(margin,160,540,H*.39,'s');title(margin+30,200,480,H*.28,80);body(margin,H*.65,400,H*.18,26);break;
 case 18:footer();title(margin,110,900,H*.15,68);P(margin,H*.4,900,H*.28);body(margin,H*.74,890,H*.08,23);break;
 case 19:footer();R(margin,130,900,6,'a');title(margin,150,900,H*.14,64);body(margin,H*.46,430,H*.22,23);P(540,H*.46,410-margin,H*.3);T('COME AS YOU ARE',margin,H*.73,430,H*.06,20,'mono');break;
 }
 return {...t,palette:palettes[b.index%palettes.length],commands};
}
