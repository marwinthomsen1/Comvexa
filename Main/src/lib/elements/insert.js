import { makeElement, addElement } from "../editor/document.js";
import { getGraphic } from "./catalog.js";
export function insertLibraryElement(doc, id, elementId, fill = "#8955ed") {
  const item = getGraphic(id);
  if (!item) throw new Error("Choose an available element.");
  const width = Math.min(280, doc.canvas.width * 0.5, doc.canvas.height * 0.5 * item.ratio);
  const height = width / item.ratio;
  const element = {
    ...makeElement(item.primitive || "rect", elementId),
    x: (doc.canvas.width - width) / 2,
    y: (doc.canvas.height - height) / 2,
    width, height, fill,
    cornerRadius: Math.min(item.radius || 0, height / 2),
    ...(item.path ? { graphicKind: item.id } : {}),
  };
  return addElement(item.path ? {...doc, schemaVersion: 2} : doc, element);
}
