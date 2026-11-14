import {fillAttributes} from "../editor/fills.js";
import { getGraphic } from "./catalog.js";
import { graphicBounds } from "./bounds.js";
// Both canvas and exporter use these same native path attributes. Parent Group owns
// document transforms; the child maps original artwork into its exact layout frame.
export function graphicPathAttributes(e) {
  const item = getGraphic(e.graphicKind), b = graphicBounds[e.graphicKind];
  if (!item?.path || !b) throw new Error("Unsupported graphic.");
  const fill=fillAttributes({...e,width:b.width,height:b.height});
  for(const key of ['fillLinearGradientStartPoint','fillLinearGradientEndPoint','fillRadialGradientStartPoint','fillRadialGradientEndPoint'])if(fill[key])fill[key]={x:fill[key].x+b.x,y:fill[key].y+b.y};
  return {
    data: item.path,
    x: -b.x * e.width / b.width, y: -b.y * e.height / b.height,
    scaleX: e.width / b.width, scaleY: e.height / b.height,
    fill: e.fill, stroke: e.stroke, strokeWidth: e.strokeWidth,
    strokeScaleEnabled: false,
    ...fill,
  };
}
