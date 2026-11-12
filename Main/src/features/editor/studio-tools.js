import { getGraphic } from "@/lib/elements/catalog";
// UI state only: never persisted in a design document.
export const STUDIO_TOOLS = [
  { id: "Templates", icon: "grid", hint: "Start with an editable layout" },
  { id: "Text", icon: "type", hint: "Add and edit text" },
  { id: "Elements", icon: "shapes", hint: "Shapes, symbols, badges and decorations" },
  { id: "Photos", icon: "image", hint: "Original Comvexa sample photos" },
  { id: "Uploads", icon: "upload", hint: "Add your own images" },
  { id: "Backgrounds", icon: "palette", hint: "Change the canvas color" },
  { id: "Layers", icon: "layers", hint: "Select and arrange your elements" },
  { id: "Resize", icon: "resize", hint: "Canvas dimensions and presets" },
];
export function selectionLabel(element) {
  if (!element) return "Your canvas";
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
