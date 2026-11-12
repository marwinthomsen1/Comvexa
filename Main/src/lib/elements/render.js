import { getGraphic } from "./catalog.js";
import { graphicBounds } from "./bounds.js";
// Both canvas and exporter use these same native path attributes. Parent Group owns
// document transforms; the child maps original artwork into its exact layout frame.
export function graphicPathAttributes(e) {
  const item = getGraphic(e.graphicKind), b = graphicBounds[e.graphicKind];
  if (!item?.path || !b) throw new Error("Unsupported graphic.");
  return {
    data: item.path,
    x: -b.x * e.width / b.width, y: -b.y * e.height / b.height,
    scaleX: e.width / b.width, scaleY: e.height / b.height,
    fill: e.fill, stroke: e.stroke, strokeWidth: e.strokeWidth,
    strokeScaleEnabled: false,
  };
}
