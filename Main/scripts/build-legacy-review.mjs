import sharp from "sharp";
import {templates} from "../src/lib/templates/catalog.js";
for(let batch=0;batch<4;batch++) {
 const layers=[];
 for(let n=0;n<8;n++) {
  const t=templates[batch*8+n],x=n%4*320,y=Math.floor(n/4)*590;
  layers.push({input:await sharp(`docs/template-review/legacy/${t.id}.webp`).resize({width:292,height:510,fit:"contain",background:"#ece9e2"}).png().toBuffer(),left:x+14,top:y+12});
  layers.push({input:Buffer.from(`<svg width="310" height="45"><text x="14" y="25" font-family="Arial" font-size="14">${t.id}</text></svg>`),left:x,top:y+530});
 }
 await sharp({create:{width:1280,height:1180,channels:3,background:"#f7f5ef"}}).composite(layers).webp({quality:85}).toFile(`docs/template-review/legacy-contact-${batch+1}.webp`);
}
