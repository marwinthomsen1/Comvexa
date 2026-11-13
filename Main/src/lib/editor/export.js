import { ensureDocumentFonts } from "../typography/fonts.js";
import { textStyleAttributes } from "../typography/style.js";
import { graphicPathAttributes } from "../elements/render.js";
import Konva from "konva";
import { exportSpec } from "./document.js";
import { loadRenderImage, loadElementImage } from "./images.js";
export function nodeAttributes(e) {
  return {
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    rotation: e.rotation,
    opacity: e.opacity,
  };
}
export async function renderExport(doc, format, quality, maxDimension = null) {
  const spec = exportSpec(doc, format, quality);
  await ensureDocumentFonts(doc);
  await document.fonts.ready;
  const images = {};
  const container = document.createElement("div");
  const scale = maxDimension ? Math.min(1, maxDimension / Math.max(spec.width, spec.height)) : 1;
  const stage = new Konva.Stage({
    container,
    width: Math.max(1, Math.round(spec.width * scale)),
    height: Math.max(1, Math.round(spec.height * scale)),
  });
  const layer = new Konva.Layer({scaleX:scale,scaleY:scale});
  stage.add(layer);
  try {
    for (const [id, a] of Object.entries(doc.assets))
      images[id] = await loadRenderImage(a.src,undefined,maxDimension);
    layer.add(
      new Konva.Rect({
        width: spec.width,
        height: spec.height,
        fill: doc.canvas.background,
      }),
    );
    for (const e of doc.elements) {
      if (e.hidden) continue;
      const attrs = nodeAttributes(e);
      let node;
      if (e.type === "text")
        node = new Konva.Text({
          ...attrs,
          text: e.text,
          fontFamily: e.fontFamily,
          fontSize: e.fontSize,
          ...textStyleAttributes(e),
          fill: e.fill,
          align: e.align,
          lineHeight: e.lineHeight,
          wrap: "word",
        });
      else if (e.type === "image") {
        const a = doc.assets[e.assetId];
        let source = images[e.assetId];
        if (e.photoFrame || (e.photoStyle && Object.values(e.photoStyle).some(v=>v!==0))) {
          source = await loadElementImage(a,e,maxDimension);
          images[`adjusted-${e.id}`] = source;
        }
        node = new Konva.Image({
          ...attrs,
          image: source,
          crop: e.photoFrame?{x:0,y:0,width:source.width,height:source.height}:{
            x: e.crop.x * source.width,
            y: e.crop.y * source.height,
            width: e.crop.width * source.width,
            height: e.crop.height * source.height,
          },
        });
      } else if (e.graphicKind) {
        node = new Konva.Group(attrs);
        node.add(new Konva.Path(graphicPathAttributes(e)));
      } else if (e.type === "ellipse")
        node = new Konva.Ellipse({
          ...attrs,
          offsetX: -e.width / 2,
          offsetY: -e.height / 2,
          radiusX: e.width / 2,
          radiusY: e.height / 2,
          fill: e.fill,
          stroke: e.stroke,
          strokeWidth: e.strokeWidth,
        });
      else
        node = new Konva.Rect({
          ...attrs,
          fill: e.fill,
          stroke: e.stroke,
          strokeWidth: e.strokeWidth,
          cornerRadius: e.cornerRadius,
        });
      layer.add(node);
    }
    layer.draw();
    const canvas = stage.toCanvas({ pixelRatio: 1 });
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Export encoding failed.")),
        spec.mimeType,
        spec.quality,
      ),
    );
  } finally {
    stage.destroy();
    for (const canvas of Object.values(images)) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[^a-z0-9 ._-]/gi, "_");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
