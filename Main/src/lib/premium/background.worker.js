import {removeSolidPixels} from './background-pixels.js';
self.onmessage=event=>{try{const {pixels,width,height,settings}=event.data,result=removeSolidPixels(pixels,width,height,settings,value=>self.postMessage({progress:value}));self.postMessage(result,[result.pixels.buffer]);}catch(error){self.postMessage({error:error.message});}};
