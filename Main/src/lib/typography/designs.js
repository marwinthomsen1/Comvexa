import {makeElement,addElement} from '../editor/document.js';
import {groupSelection} from '../editor/selection.js';
import {effectStyle} from './style.js';
const t=(text,fontFamily,fontSize,fill,x=30,y=65,width=540,extra={})=>({type:'text',text,fontFamily,fontSize,fill,x,y,width,height:170,fontWeight:'normal',lineHeight:1.1,align:'center',...extra});
const r=(fill,x,y,width,height,cornerRadius=0)=>({type:'rect',fill,x,y,width,height,cornerRadius});
const look=(effect,extra={})=>({...effectStyle(effect),...extra});
const d=(id,name,category,elements,background='#f8f3e9')=>({id,name,category,elements,background});
export const textDesigns=[
 d('bold','Big idea','Headlines',[t('BIG IDEA','Anton',104,'#202044',25,65,550)]),
 d('editorial','The editorial','Headlines',[t('The next chapter','Playfair Display',62,'#273b34',30,85,540,{fontWeight:'bold',textStyle:look('none',{italic:true})}),r('#b38b52',220,175,160,3)]),
 d('condensed','Make some noise','Headlines',[t('MAKE SOME\nNOISE','Bebas Neue',78,'#e6475b',25,35,550)]),
 d('serif','Quiet luxury','Elegant',[t('MAISON','Bodoni Moda',78,'#8d6b36',30,65,540,{textStyle:look('none',{letterSpacing:9})}),t('EST. 2026 · MADE WITH CARE','Montserrat',14,'#8d6b36',30,170,540)]),
 d('invitation','You are invited','Elegant',[t('You are invited','Great Vibes',76,'#8b4e67',20,65,560),t('TO A LITTLE CELEBRATION','Lato',15,'#8b4e67',30,168,540,{textStyle:look('none',{letterSpacing:3})})]),
 d('wedding','Save the date','Elegant',[t('Save the date','Cormorant Garamond',68,'#435e50',25,66,550,{textStyle:look('none',{italic:true})}),t('JUNE 21 · WITH LOVE','Montserrat',16,'#435e50',30,163,540)]),
 d('pink-neon','Pink neon','Effects',[r('#151126',0,0,600,260,18),t('after hours','Montserrat',70,'#ffadf0',25,80,550,{fontWeight:'bold',textStyle:look('neon',{outlineColor:'#ff2bc6',shadowColor:'#ff2bc6'})})],'#151126'),
 d('electric','Electric blue','Effects',[r('#0c1938',0,0,600,260,18),t('ELECTRIC','Outfit',76,'#b1faff',25,76,550,{fontWeight:'bold',textStyle:look('glow',{shadowColor:'#00d8ff',shadowBlur:22})})],'#0c1938'),
 d('outline','Outline club','Effects',[t('OUTLINE','Anton',90,'#f8f3e9',20,67,560,{textStyle:look('outline',{outlineColor:'#7747df',outlineWidth:3})})]),
 d('chromatic','Chromatic','Effects',[t('Color outside','Outfit',74,'#7739ed',20,80,560,{fontWeight:'bold',textStyle:look('gradient',{gradientFrom:'#7034f1',gradientTo:'#f64987',gradientAngle:15})})]),
 d('sunset','Sunset lettering','Effects',[t('GOLDEN HOUR','Anton',72,'#ff714d',20,75,560,{textStyle:look('gradient',{gradientFrom:'#ff375c',gradientTo:'#efb52b',gradientAngle:90})})]),
 d('retro','Stay groovy','Retro',[t('Stay groovy','Alfa Slab One',65,'#ffce8a',20,75,560,{textStyle:look('offset',{outlineWidth:1,outlineColor:'#823c43',shadowColor:'#823c43',shadowOffsetX:5,shadowOffsetY:6})})]),
 d('varsity','Varsity team','Retro',[t('VARSITY','Alfa Slab One',80,'#3653ad',20,70,560,{textStyle:look('outline',{outlineColor:'#f7b34f',outlineWidth:5,letterSpacing:2})}),t('ATHLETIC CLUB · 2026','Montserrat',16,'#3653ad',20,178,560)]),
 d('print','Retro print','Retro',[t('GOOD TIMES','Bebas Neue',92,'#e25e48',25,62,550,{textStyle:look('offset',{shadowColor:'#e7b748',shadowOffsetX:7,shadowOffsetY:7,letterSpacing:3})})]),
 d('sale','Big weekend sale','Promotions',[t('WEEKEND','Montserrat',22,'#dc2761',25,35,550,{fontWeight:'bold',textStyle:look('none',{letterSpacing:7})}),t('SALE','Anton',116,'#dc2761',20,69,560),t('UP TO 50% OFF','Montserrat',22,'#dc2761',25,203,550)]),
 d('offer','Offer label','Promotions',[r('#7544db',30,42,540,174,18),t('SPECIAL OFFER','Anton',57,'#ffffff',45,74,510),t('GOOD THINGS. BETTER PRICES.','Montserrat',17,'#e6dcff',45,156,510)]),
 d('drop','New collection','Promotions',[t('NEW DROP','Bebas Neue',95,'#181f3b',20,53,560),r('#32bdb5',215,162,170,7),t('YOUR EVERYDAY, REIMAGINED','Lato',16,'#181f3b',20,193,560)]),
 d('birthday','Birthday wishes','Celebrations',[t('Happy Birthday!','Caveat',78,'#df4d8a',15,57,570,{fontWeight:'bold'}),t('MAKE A WISH · CELEBRATE YOU','Montserrat',16,'#7752aa',20,174,560)]),
 d('party','Party time','Celebrations',[r('#ffd760',25,35,550,190,25),t('PARTY TIME','Anton',83,'#6d38ce',35,65,530),t('LET’S MAKE SOME MEMORIES','Montserrat',18,'#6d38ce',35,173,530)]),
 d('thankyou','With gratitude','Celebrations',[t('Thank you','Great Vibes',94,'#a45a55',15,58,570),t('YOU MAKE ALL THE DIFFERENCE','Lato',16,'#a45a55',20,178,560)]),
 d('quote','Daily reminder','Quotes',[t('“','Georgia',100,'#c38560',20,5,560),t('Small steps.\nReal progress.','Playfair Display',51,'#30334b',20,69,560,{fontWeight:'bold'}),t('A NOTE TO SELF','Montserrat',13,'#8e6972',20,210,560)]),
 d('note','Handwritten note','Quotes',[t('you’ve got this.','Caveat',87,'#3158a5',20,60,560),r('#edb94b',167,175,265,5)]),
 d('minimal','Minimal pairing','Font combinations',[t('LESS, BUT BETTER','Manrope',40,'#25333a',20,69,560,{fontWeight:'bold',textStyle:look('none',{letterSpacing:2})}),t('Make space for what matters.','Lora',24,'#687478',20,143,560)]),
 d('magazine','Magazine cover','Font combinations',[t('THE EDIT','Bodoni Moda',90,'#202b40',20,42,560),r('#202b40',55,151,490,2),t('STYLE · CULTURE · YOUR NEXT BIG IDEA','Montserrat',14,'#202b40',20,181,560)]),
 d('travel','Adventure awaits','Font combinations',[t('Adventure','Pacifico',65,'#1d847f',20,44,560),t('AWAITS','Montserrat',46,'#265278',20,132,560,{fontWeight:'bold',textStyle:look('none',{letterSpacing:12})})]),
 d('podcast','Podcast title','Font combinations',[r('#222345',20,30,560,200,12),t('OFF THE RECORD','Anton',64,'#f1a7cb',35,63,530),t('REAL PEOPLE. GOOD CONVERSATIONS.','Inter',16,'#ffffff',35,161,530)],'#222345'),
 d('menu','Made fresh','Font combinations',[t('Made fresh','Lobster',73,'#c34e35',20,52,560),t('GOOD FOOD. GREAT COMPANY.','Montserrat',17,'#52643e',20,162,560)]),
 d('signature','Personal signature','Handwritten',[t('Just a little magic','Dancing Script',72,'#7952bb',20,76,560)]),
];
export const textDesignCategories=['All',...new Set(textDesigns.map(d=>d.category))];
export function insertTextDesign(doc,id,idFactory){
 const design=textDesigns.find(d=>d.id===id);if(!design)throw Error('Unknown text design.');
 const scale=Math.min(doc.canvas.width*.85/600,doc.canvas.height*.7/260,2),x=(doc.canvas.width-600*scale)/2,y=(doc.canvas.height-260*scale)/2,ids=[];
 let next={...doc,schemaVersion:2};
 for(const item of design.elements){const key=idFactory(),e={...makeElement(item.type,key),...item,id:key,x:x+item.x*scale,y:y+item.y*scale,width:item.width*scale,height:item.height*scale};
 if(item.type==='text'){e.fontSize=Math.max(6,item.fontSize*scale);e.height=Math.min(item.height,260-item.y)*scale;if(item.textStyle){e.textStyle={...item.textStyle};for(const k of ['letterSpacing','outlineWidth','shadowBlur','shadowOffsetX','shadowOffsetY'])e.textStyle[k]*=scale;}}
 if(item.cornerRadius)e.cornerRadius=item.cornerRadius*scale;
 next=addElement(next,e);ids.push(key);
 }if(ids.length>1)next=groupSelection(next,ids,idFactory());return{document:next,ids};
}
