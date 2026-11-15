import {motionFrame} from "./motion.js";
import {arcPath,displayText} from "../typography/layout.js";
import {drawingPaths} from "./drawing.js";
import {fillAttributes} from "./fills.js";
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
    globalCompositeOperation:e.blendMode||"source-over",
  };
}
export async function createArtworkRenderer(doc, maxDimension = null) {
  const format="png",quality=.92;
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
  const background=new Konva.Layer({scaleX:scale,scaleY:scale});
  layer.getCanvas().setPixelRatio(1);background.getCanvas().setPixelRatio(1);
  stage.add(background,layer);
  const nodes=new Map();
  try {
    for (const [id, a] of Object.entries(doc.assets))
      images[id] = await loadRenderImage(a.src,undefined,maxDimension);
    const backgroundAttributes={
        width: spec.width,
        height: spec.height,
        fill: doc.canvas.transparent?(format==='jpeg'?'#ffffff':undefined):doc.canvas.background,
        ...fillAttributes({width:spec.width,height:spec.height,fillEffect:doc.canvas.transparent?null:doc.canvas.fillEffect}),
    };
    background.add(new Konva.Rect(backgroundAttributes));
    layer.add(new Konva.Rect(backgroundAttributes));
    const backdrop=new Konva.Image({width:spec.width,height:spec.height,visible:false});
    layer.add(backdrop);
    for (const e of doc.elements) {
      if (e.hidden) continue;
      const attrs = nodeAttributes(e);
      let node;
      if(e.type==='text'&&e.textLayout?.mode==='arc')node=new Konva.TextPath({...attrs,data:arcPath(e),text:e.text.replaceAll('\n',' '),fontFamily:e.fontFamily,fontSize:e.fontSize,...textStyleAttributes(e),align:e.align,fill:e.fill});
      else if (e.type === "text")
        node = new Konva.Text({
          ...attrs,
          text: displayText(e),
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
      } else if(e.drawing){node=new Konva.Group(attrs);for(const path of drawingPaths(e))node.add(new Konva.Path(path));
      } else if (e.graphicKind) {
        node = new Konva.Group(attrs);
        node.add(new Konva.Path(graphicPathAttributes(e)));
      } else if (e.type === "ellipse")
        node = new Konva.Ellipse({
          ...attrs,
          offsetX: -e.width / 2,
          offsetY: -e.height / 2,
          ...fillAttributes(e),
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
          ...fillAttributes(e),
        });
      layer.add(node);nodes.set(e.id,node);
    }
    background.draw();layer.draw();
    let destroyed=false;
    return {
      background:background.getCanvas()._canvas,
      canvas:layer.getCanvas()._canvas,
      render(time=0,animated=true,compositionBackdrop=null){
        backdrop.image(compositionBackdrop);backdrop.visible(!!compositionBackdrop);
        for(const e of doc.elements){const node=nodes.get(e.id);if(!node)continue;const timing=e.timing,visible=!e.hidden&&(!animated||!timing||(time>=timing.start&&time<timing.end));let f={opacity:1,dx:0,dy:0,scale:1,rotation:0};
          if(animated&&e.animation){const a=e.animation;f=motionFrame(a.type,(time-(timing?.start||0)-a.delay)/a.duration);}
          node.setAttrs({visible,opacity:e.opacity*f.opacity,x:e.x+f.dx+e.width*(1-f.scale)/2,y:e.y+f.dy+e.height*(1-f.scale)/2,rotation:e.rotation+f.rotation,scaleX:f.scale,scaleY:f.scale});
        }layer.draw();return layer.getCanvas()._canvas;
      },
      destroy(){if(destroyed)return;destroyed=true;stage.destroy();for(const canvas of Object.values(images)){canvas.width=0;canvas.height=0;}}
    };
  }catch(error){stage.destroy();for(const canvas of Object.values(images)){canvas.width=0;canvas.height=0;}throw error;}
}
export async function renderExport(doc, format, quality, maxDimension=null){
 const spec=exportSpec(doc,format,quality),renderer=await createArtworkRenderer(doc,maxDimension);
 try{const canvas=document.createElement('canvas');canvas.width=renderer.canvas.width;canvas.height=renderer.canvas.height;const ctx=canvas.getContext('2d');if(format==='jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(renderer.render(0,false),0,0);return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Export encoding failed.')),spec.mimeType,spec.quality));}finally{renderer.destroy();}
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[^a-z0-9 ._-]/gi, "_");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
