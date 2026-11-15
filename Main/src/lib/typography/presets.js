import {fitText} from "../templates/fitting.js";
import {effectStyle} from "./style.js";
export const textPresets = [
 {id:'metallic',name:'Metallic editorial',fontFamily:'Bodoni Moda',fontWeight:'bold',fill:'#ad874d',fontSize:78,lineHeight:1.15,effect:'metallic'},
 {id:'chrome',name:'Chrome headline',fontFamily:'Montserrat',fontWeight:'bold',fill:'#a9bdcf',fontSize:76,lineHeight:1.1,effect:'chrome'},
 {id:'glass',name:'Glass lettering',fontFamily:'Outfit',fontWeight:'bold',fill:'#bdd8ef',fontSize:76,lineHeight:1.1,effect:'glass'},
 {id:'raised',name:'Raised display',fontFamily:'Anton',fontWeight:'normal',fill:'#e7a68e',fontSize:82,lineHeight:1.12,effect:'raised'},
 {id:"modern",name:"Modern headline",fontFamily:"Inter",fontWeight:"bold",fill:"#17243c",fontSize:76,lineHeight:1.05,style:{letterSpacing:-1}},
 {id:"luxury",name:"Luxury title",fontFamily:"Bodoni Moda",fontWeight:"normal",fill:"#9b742c",fontSize:78,lineHeight:1.15,style:{letterSpacing:4}},
 {id:"minimal",name:"Minimal subtitle",fontFamily:"Manrope",fontWeight:"normal",fill:"#465267",fontSize:32,lineHeight:1.4,style:{letterSpacing:3}},
 {id:"neon",name:"Neon title",fontFamily:"Montserrat",fontWeight:"bold",fill:"#fff4fc",fontSize:76,lineHeight:1.1,effect:"neon"},
 {id:"retro",name:"Retro advertisement",fontFamily:"Alfa Slab One",fontWeight:"normal",fill:"#f8da94",fontSize:70,lineHeight:1.15,effect:"offset",style:{outlineWidth:1.5,outlineColor:"#633a35",shadowColor:"#b64e32",shadowOffsetX:5,shadowOffsetY:5}},
 {id:"invitation",name:"Elegant invitation",fontFamily:"Great Vibes",fontWeight:"normal",fill:"#6f4658",fontSize:76,lineHeight:1.35,style:{letterSpacing:1}},
 {id:"sale",name:"Bold sale announcement",fontFamily:"Anton",fontWeight:"normal",fill:"#f7df3a",fontSize:96,lineHeight:1.05,effect:"outline",style:{outlineColor:"#dc2147",outlineWidth:3,letterSpacing:2}},
 {id:"editorial",name:"Editorial heading",fontFamily:"Playfair Display",fontWeight:"bold",fill:"#263b31",fontSize:72,lineHeight:1.15,style:{italic:true}},
 {id:"gradient",name:"Chromatic headline",fontFamily:"Outfit",fontWeight:"bold",fill:"#7235ef",fontSize:82,lineHeight:1.1,effect:"gradient",style:{gradientFrom:"#612afa",gradientTo:"#ff4a68",gradientAngle:20}},
 {id:"handwritten",name:"Personal note",fontFamily:"Caveat",fontWeight:"normal",fill:"#254a87",fontSize:68,lineHeight:1.3,style:{letterSpacing:1}},
];
export function presetPatch(id) {
 const p=textPresets.find(p=>p.id===id);if(!p)throw new Error("Unknown text preset.");
 return {fontFamily:p.fontFamily,fontWeight:p.fontWeight,fontSize:p.fontSize,fill:p.fill,lineHeight:p.lineHeight,textStyle:{...effectStyle(p.effect||"none"),...p.style}};
}

// Preserve content/bindings and the user's box; fit only the proposed preset size.
export function fitPresetToBox(element, patch, measure) {
 const style=patch.textStyle,spacing=style.letterSpacing||0;
 const fitted=fitText(element.text,{width:element.width*.98,height:element.height*.98},{font:patch.fontFamily,weight:`${style.italic?"italic ":""}${patch.fontWeight}`,max:patch.fontSize,min:6,lineHeight:patch.lineHeight,measure:(text,size,font,weight)=>measure(text,size,font,weight)+spacing*[...text].length});
 return {...patch,fontSize:fitted.fontSize};
}
