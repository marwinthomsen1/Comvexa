import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {volumeTemplates} from '../src/lib/templates/volume-two.js';
import {volumeRecipe} from '../src/lib/templates/volume-recipes.js';
import {generateRecipe,validateCuratedQuality} from '../src/lib/templates/curated-generate.js';
import photos from '../src/lib/creative/photo-library.json' with {type:'json'};
const assets={};for(const p of photos){const bytes=await sharp(await readFile('public'+p.path)).resize({width:600,height:600,fit:'inside'}).png().toBuffer();assets[p.id]={src:`data:image/png;base64,${bytes.toString('base64')}`,width:400,height:400};}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function render(doc){let defs='',body=`<rect width="${doc.canvas.width}" height="${doc.canvas.height}" fill="${doc.canvas.background}"/>`;
for(const e of doc.elements){if(e.type==='text'){const line=e.fontSize*e.lineHeight;body+=`<text font-family="${e.fontFamily}" font-size="${e.fontSize}" font-weight="${e.fontWeight}" fill="${e.fill}" text-anchor="${e.align==='center'?'middle':e.align==='right'?'end':'start'}">${e.text.split('\n').map((v,i)=>`<tspan x="${e.x+(e.align==='center'?e.width/2:e.align==='right'?e.width:0)}" y="${e.y+e.fontSize+i*line}">${esc(v)}</tspan>`).join('')}</text>`;}else if(e.type==='image'){const a=doc.assets[e.assetId];defs+=`<clipPath id="${e.id}"><rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}"/></clipPath>`;body+=`<image href="${a.src}" x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${e.id})"/>`;}else if(e.type==='ellipse')body+=`<ellipse cx="${e.x+e.width/2}" cy="${e.y+e.height/2}" rx="${e.width/2}" ry="${e.height/2}" fill="${e.fill}"/>`;else body+=`<rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" rx="${e.cornerRadius||0}" fill="${e.fill}"/>`;}
return `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.canvas.width}" height="${doc.canvas.height}" viewBox="0 0 ${doc.canvas.width} ${doc.canvas.height}"><defs>${defs}</defs>${body}</svg>`;}
await mkdir('public/images/templates',{recursive:true});let issues=[];
for(const t of volumeTemplates){try{const doc=generateRecipe(volumeRecipe(t.id),assets);const warnings=validateCuratedQuality(doc);if(warnings.length)issues.push([t.id,warnings]);await sharp(Buffer.from(render(doc))).resize({width:360}).webp({quality:80}).toFile(`public/images/templates/${t.id}.webp`);}catch(e){issues.push([t.id,e.message]);}}
await writeFile('/tmp/comvexa-volume-issues.json',JSON.stringify(issues,null,2));console.log({templates:volumeTemplates.length,issues:issues.length,examples:issues.slice(0,12)});if(issues.length)process.exitCode=1;
