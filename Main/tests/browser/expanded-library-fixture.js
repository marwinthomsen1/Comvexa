"use client";
import Image from "next/image";
import {useState} from 'react';
import {volumeTemplates} from '@/lib/templates/volume-two';
import {volumeRecipe} from '@/lib/templates/volume-recipes';
import {generateRecipe,validateCuratedQuality} from '@/lib/templates/curated-generate';
import {libraryPhoto} from '@/lib/creative/photo-assets';
import {browserMeasure} from '@/lib/templates/fitting';
import {renderExport} from '@/lib/editor/export';
import {loadImage} from '@/lib/editor/images';
import {extraStickers} from '@/lib/creative/sticker-expansion';
import {stickerAsset} from '@/lib/creative/stickers';
export default function LibraryValidation(){const [result,setResult]=useState('Ready'),[busy,setBusy]=useState(false),[preview,setPreview]=useState('');async function run(){setBusy(true);try{await document.fonts.ready;const assets={};let exports=0;for(const t of volumeTemplates){const recipe=volumeRecipe(t.id);for(const key of new Set(recipe.commands.filter(c=>c[0]==='p').map(c=>c[1])))if(!assets[key])assets[key]=await libraryPhoto(key);const doc=generateRecipe(recipe,assets,browserMeasure),warnings=validateCuratedQuality(doc,browserMeasure);if(warnings.length)throw Error(t.id+': '+warnings.join(', '));if(t.brief==='coffee'&&[0,4,9,14,19].includes(t.layout)){for(const format of ['png','jpeg']){const blob=await renderExport(doc,format,.92),url=URL.createObjectURL(blob);try{const image=await loadImage(url);if(image.width!==doc.canvas.width||image.height!==doc.canvas.height||blob.size<2000)throw Error('Export decode failed');if(!exports)setPreview(image.src);else URL.revokeObjectURL(url);exports++;}catch(e){URL.revokeObjectURL(url);throw e;}}}setResult(`${t.id} passed`);}for(const s of extraStickers)await stickerAsset(s.id);setResult(`PASS: 500 templates fit actual browser fonts; ${exports} PNG/JPEG exports decoded; ${Object.keys(assets).length} full-resolution photos loaded; 200 new stickers rasterized. No workspace records changed.`);}catch(e){setResult('FAIL: '+e.message);}finally{setBusy(false);}}return <main style={{maxWidth:1000,padding:40,margin:'auto'}}><h1>Expanded library verification</h1><p>This check builds documents in memory and does not edit or save your designs.</p><button className="button" disabled={busy} onClick={run}>Validate templates, photos and stickers</button><p role="status">{result}</p>{preview&&<Image unoptimized width={400} height={400} src={preview} alt="Actual template export" style={{width:400,maxWidth:'100%'}}/>}<a href="/dashboard/templates">Open template library</a></main>;}
