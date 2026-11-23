import {accountStorage} from "../cloud/account-scope.js";
import {rememberAsset} from '../workspace-ui/preferences.js';
// Document recipes and assets load only after a user chooses a template.
export async function createTemplateDocument(id){
 if(id.startsWith('collection-')){const [{volumeRecipe},{generateRecipe},{readImage}]=await Promise.all([import('./volume-recipes.js'),import('./curated-generate.js'),import('../editor/images.js')]);const photos=(await import('../creative/photo-library.json',{with:{type:'json'}})).default;const recipe=volumeRecipe(id),assets={};for(const key of new Set(recipe.commands.filter(c=>c[0]==='p').map(c=>c[1]))){const photo=photos.find(p=>p.id===key),response=await fetch(photo.path);if(!response.ok)throw Error('Photo could not load. Retry.');const blob=await response.blob();assets[key]=await readImage(new File([blob],photo.name,{type:blob.type}));}await document.fonts.ready;const {browserMeasure}=await import('./fitting.js');return generateRecipe(recipe,assets,browserMeasure);}
 if(id.startsWith('video-')){const {generateVideoTemplate}=await import('../video/templates.js');return generateVideoTemplate(id);}

 if(/^(resume|deck|print|collage)-/.test(id)){const {generateExpansion}=await import('./expansion-generate.js');let assets={};if(id.startsWith('collage-')){const {readImage}=await import('../editor/images.js');const response=await fetch('/images/previews/travel.webp');if(!response.ok)throw Error('Example photo could not load. Retry.');const blob=await response.blob();assets={travel:await readImage(new File([blob],'travel.webp',{type:blob.type}))};}return generateExpansion(id,assets);}
 const [{generateCurated},{curatedAssets},{browserMeasure}]=await Promise.all([import('./curated-generate.js'),import('./curated-assets.js'),import('./fitting.js')]);
 await document.fonts.ready;
 return generateCurated(id,await curatedAssets(id),browserMeasure);
}
const key='comvexa-recent-templates';
export function recentTemplateIds(){try{const v=JSON.parse(accountStorage().getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,8):[];}catch{return [];}}
export function rememberTemplate(id){rememberAsset(id.startsWith('resume-')||id.startsWith('studio-')||id.startsWith('deck-')||id.startsWith('print-')||id.startsWith('collage-')||id.startsWith('video-')?'template:'+id:'template-set:'+id);try{accountStorage().setItem(key,JSON.stringify([id,...recentTemplateIds().filter(v=>v!==id)].slice(0,8)));}catch{/* Design storage remains authoritative if preferences are unavailable. */}}
