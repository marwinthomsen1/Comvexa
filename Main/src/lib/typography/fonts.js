import collection from "./fonts.json" with { type: "json" };
export const SYSTEM_FONTS = ["Arial", "Georgia", "Verdana", "Courier New"];
export const fontCollection = collection;
export const FONT_NAMES = [...SYSTEM_FONTS, ...collection.map(f=>f.name)];
export const fontCategories = ["All", "Sans-serif", "Serif", "Display", "Handwritten", "Script", "System"];
export function searchFonts(query="", category="All") {
 const q=query.trim().toLowerCase();
 return [...SYSTEM_FONTS.map(name=>({name,category:"System",faces:[]})),...collection].filter(f=>(category==="All"||f.category===category)&&`${f.name} ${f.category}`.toLowerCase().includes(q));
}
// Successful FontFaces stay in the browser FontFaceSet; concurrent requests share work.
// Failure is explicit and retryable. Never fetch an arbitrary document-provided URL.
const cache = new Map();
export async function ensureFont(name, weight="normal") {
 if(SYSTEM_FONTS.includes(name)) return;
 const font=collection.find(f=>f.name===name);
 if(!font) throw new Error("Unsupported font family.");
 const desired=weight==="bold"?700:400;
 const face=font.faces.find(f=>f.weight===desired)||font.faces[0];
 const key=`${name}:${face.weight}`;
 if(!cache.has(key)) cache.set(key,(async()=>{
  const loaded=await new FontFace(name,`url("${face.path}") format("woff2")`,{weight:String(face.weight),style:"normal",display:"swap"}).load();
  document.fonts.add(loaded);
  return loaded;
 })().catch(()=>{cache.delete(key);throw new Error(`Could not load ${name}. Retry before editing or exporting.`);}));
 await cache.get(key);
}
export async function ensureDocumentFonts(doc) {
 await Promise.all(doc.elements.filter(e=>e.type==="text").map(e=>ensureFont(e.fontFamily,e.fontWeight)));
}
