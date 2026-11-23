import photos from './photo-library.json' with {type:'json'};
import {readImage} from '../editor/images.js';
export async function libraryPhoto(id){const item=photos.find(p=>p.id===id);if(!item){const {sampleAsset}=await import('../templates/assets.js');return sampleAsset(id);}const response=await fetch(item.path);if(!response.ok)throw Error('Photo could not load. Please retry.');const blob=await response.blob();return readImage(new File([blob],item.name,{type:blob.type}));}
