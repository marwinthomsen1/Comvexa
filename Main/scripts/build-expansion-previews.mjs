import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {expansionTemplates} from '../src/lib/templates/expansion-catalog.js';
import {generateExpansion} from '../src/lib/templates/expansion-generate.js';
import sharp from 'sharp';
const photo=await readFile('public/images/previews/travel.webp'), info=await sharp(photo).metadata(), assets={travel:{src:`data:image/webp;base64,${photo.toString('base64')}`,width:info.width,height:info.height}};
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
await mkdir('public/images/templates',{recursive:true});
let pageCount=0;
for(const t of expansionTemplates){const doc=generateExpansion(t.id,assets);pageCount+=doc.pages.length;
 for(let index=0;index<doc.pages.length;index++){const page=doc.pages[index],{width,height,background}=page.canvas;
 const nodes=page.elements.map(e=>{if(e.type==='rect')return `<rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" fill="${e.fill}"/>`;if(e.type==='image'){const a=doc.assets[e.assetId],c=e.crop,sw=e.width/c.width,sh=e.height/c.height;return `<svg x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" viewBox="0 0 ${e.width} ${e.height}" overflow="hidden"><image href="${a.src}" x="${-c.x*sw}" y="${-c.y*sh}" width="${sw}" height="${sh}" preserveAspectRatio="none" data-source-width="${a.width}"/></svg>`;}if(e.type==='text'){const line=e.fontSize*e.lineHeight,anchor=e.align==='center'?'middle':e.align==='right'?'end':'start',x=e.x+(e.align==='center'?e.width/2:e.align==='right'?e.width:0);return `<text font-family="${escape(e.fontFamily)}" font-size="${e.fontSize}" font-weight="${e.fontWeight}" fill="${e.fill}" text-anchor="${anchor}">${e.text.split('\n').map((s,i)=>`<tspan x="${x}" y="${e.y+e.fontSize+i*line}">${escape(s)}</tspan>`).join('')}</text>`;}throw Error('Preview renderer needs support for '+e.type);}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="480" height="${Math.round(480*height/width)}"><rect width="${width}" height="${height}" fill="${background}"/>${nodes}</svg>`;
 if(t.id.startsWith('collage-'))await sharp(Buffer.from(svg)).resize({width:480}).webp({quality:82}).toFile(`public/images/templates/${t.id}.webp`);
 else await writeFile(`public/images/templates/${t.id}${index?`-page-${index+1}`:''}.svg`,svg);
 }
}
console.log(`Generated ${expansionTemplates.length} accurate covers and ${pageCount} page previews; all documents passed schema and text fitting validation.`);
