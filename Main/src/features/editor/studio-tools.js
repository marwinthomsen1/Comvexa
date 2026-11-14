import { getGraphic } from "@/lib/elements/catalog";
// UI state only: never persisted in a design document.
export const STUDIO_TOOLS = [
 {id:'Design',icon:'grid',hint:'Templates, backgrounds, styles and resize',tabs:['Templates','Backgrounds','Resize']},
 {id:'Text',icon:'type',hint:'Typography and text presets',tabs:['Text']},
 {id:'Photos',icon:'image',hint:'Photos and uploads; select a photo for crop, masks and adjustments',tabs:['Photos','Uploads']},
 {id:'Elements',icon:'shapes',hint:'Shapes, stickers, frames and drawing',tabs:['Elements','Drawing']},
 {id:'Arrange',icon:'layers',hint:'Layers, precision guides and layout',tabs:['Layers','Precision']},
 {id:'Animate',icon:'spark',hint:'Element motion and page entrances',tabs:['Animate']},
];
export const toolGroup=tab=>STUDIO_TOOLS.find(t=>t.tabs.includes(tab));
export function selectionLabel(element) {
  if (!element) return "Your canvas";
  if(element.drawing)return element.drawing.brush==='line'?'Drawn line':'Drawing stroke';
  if (element.graphicKind) return getGraphic(element.graphicKind)?.name || "Graphic";
  return element.type === "text"
    ? "Text"
    : element.type === "image"
      ? "Photo"
      : "Shape";
}
export function connectionLabel(element) {
  return !element?.binding
    ? "Independent"
    : element.localOverride
      ? "Custom value"
      : "Connected";
}
