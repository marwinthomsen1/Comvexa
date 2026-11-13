import metadata from './curated-metadata.json' with {type:'json'};
import {validateDocument} from '../editor/document.js';
import {smartResize} from '../editor/smart-create.js';
export const multiPageTemplates=[
 {id:'brochure',name:'Business brochure',category:'business'},
 {id:'catalog',name:'Product catalog',category:'fashion'},
 {id:'menu',name:'Restaurant menu',category:'food'},
 {id:'program',name:'Event program',category:'events'},
 {id:'album',name:'Travel photo album',category:'travel'},
 {id:'portfolio',name:'Creative portfolio',category:'personal'},
 {id:'school',name:'School project',category:'personal'},
 {id:'slides',name:'Presentation',category:'business'},
 {id:'promotion',name:'Promotional campaign',category:'social'},
].map(t=>({...t,cover:metadata.templates.find(p=>p.category===t.category)?.id||metadata.templates[0].id}));
export async function generateMultiPageTemplate(id,idFactory=()=>crypto.randomUUID()){
 const template=multiPageTemplates.find(t=>t.id===id);if(!template)throw Error('Unknown multi-page template.');
 const [{generateCurated},{curatedAssets},{browserMeasure}]=await Promise.all([import('./curated-generate.js'),import('./curated-assets.js'),import('./fitting.js')]);
 const candidates=metadata.templates.filter(t=>t.category===template.category);if(candidates.length<3)throw Error('This collection does not have three suitable page layouts.');
 const width=id==='slides'?1920:1200,height=id==='slides'?1080:1600,pages=[],assets={};
 for(let i=0;i<3;i++){const t=candidates[i],raw=generateCurated(t.id,await curatedAssets(t.id),browserMeasure),doc=smartResize(raw,width,height).document,assetIds=new Map(),groups=new Map();
 for(const [key,asset] of Object.entries(doc.assets)){let mapped=Object.keys(assets).find(k=>assets[k].src===asset.src);if(!mapped){mapped=idFactory();assets[mapped]=asset;}assetIds.set(key,mapped);}
 const elements=doc.elements.map(e=>{if(e.groupId&&!groups.has(e.groupId))groups.set(e.groupId,idFactory());return{...e,id:idFactory(),...(e.groupId?{groupId:groups.get(e.groupId)}:{}),...(e.assetId?{assetId:assetIds.get(e.assetId)}:{})};});pages.push({id:idFactory(),name:i===0?'Cover':i===1?'Inside':'Details',canvas:doc.canvas,elements});
 }const active=pages[0];return validateDocument({schemaVersion:3,pageVersion:1,name:template.name,activePageId:active.id,pages,canvas:active.canvas,elements:active.elements,assets,bindings:[]});
}
