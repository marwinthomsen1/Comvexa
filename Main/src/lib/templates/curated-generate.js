import {
  newDesign,
  makeElement,
  validateDocument,
} from "../editor/document.js";
import { getCuratedTemplate, CURATED_SIZES } from "./curated-catalog.js";
import {
  fitText,
  coverCrop,
  approximateMeasure,
  documentWarnings,
} from "./fitting.js";
const fonts = { sans: "Arial", serif: "Georgia", mono: "Courier New" };
export const PHOTO_PATHS = {
  fashion: "/images/previews/fashion.webp",
  food: "/images/previews/food.webp",
  beauty: "/images/previews/beauty.webp",
  travel: "/images/previews/travel.webp",
  motorcycle: "/images/previews/motorcycle.webp",
};
export function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function generateCurated(id, assets = {}, measure = approximateMeasure) {
  return generateRecipe(getCuratedTemplate(id), assets, measure);
}
export function generateRecipe(t, assets = {}, measure = approximateMeasure) {
  const id=t.id,
    size = CURATED_SIZES[t.ratio],
    scale = size.width / 1000,
    doc = newDesign(t.name, size.width, size.height);
  const [b, i, a, s] = t.palette,
    colors = { b, i, a, s, w: "#ffffff" },
    elements = [],
    used = {};
  let sequence = 0;
  const next = () => `curated-${++sequence}`;
  function backgroundAt(x, y) {
    let fill = b;
    for (const e of elements) {
      if (
        ["rect", "ellipse"].includes(e.type) &&
        x >= e.x &&
        y >= e.y &&
        x <= e.x + e.width &&
        y <= e.y + e.height
      )
        fill = e.fill;
    }
    return fill;
  }
  for (const c of t.commands) {
    const type = c[0];
    if (type === "t") {
      const [, value, x, y, w, h, max, font, key, align, weight] = c,
        box = {
          width: w * scale,
          height: Math.min(h * scale, size.height - y * scale),
        };
      const fontFamily = fonts[font],
        lineHeight = 1.12;
      const fitted = fitText(
        value,
        { width: box.width * 0.97, height: box.height * 0.94 },
        {
          font: fontFamily,
          weight,
          max: Math.round(max * scale),
          min: Math.round(Math.min(max, 22) * scale),
          lineHeight,
          measure,
        },
      );
      if (fitted.overflow)
        throw new Error(`${id}: text does not fit: ${value}`);
      let fill = colors[key],
        back = backgroundAt((x + w / 2) * scale, (y + h / 2) * scale);
      if (contrast(fill, back) < 4.5)
        fill = [...t.palette, "#ffffff", "#141820"].sort(
          (a, b) => contrast(b, back) - contrast(a, back),
        )[0];
      elements.push({
        ...makeElement("text", next()),
        x: x * scale,
        y: y * scale,
        ...box,
        text: fitted.text,
        fontSize: fitted.fontSize,
        fontFamily,
        fontWeight: weight,
        align,
        lineHeight,
        fill,
      });
    } else if (type === "p") {
      const [, key, x, y, w, h, focalY = 0.5] = c,
        asset = assets[key];
      if (!asset) throw new Error(`Missing original photo: ${key}`);
      const crop = coverCrop(asset, w, h);
      crop.y = (1 - crop.height) * Math.max(0, Math.min(1, focalY));
      used[`photo-${key}`] = asset;
      elements.push({
        ...makeElement("image", next()),
        x: x * scale,
        y: y * scale,
        width: w * scale,
        height: h * scale,
        assetId: `photo-${key}`,
        crop,
      });
    } else {
      const [, x, y, w, h, key, radius = 0] = c;
      elements.push({
        ...makeElement(type === "e" ? "ellipse" : "rect", next()),
        x: x * scale,
        y: y * scale,
        width: Math.min(w * scale, size.width - x * scale),
        height: Math.min(h * scale, size.height - y * scale),
        fill: colors[key],
        cornerRadius: radius * scale,
      });
    }
  }
  return validateDocument({
    ...doc,
    canvas: { ...doc.canvas, background: b },
    assets: used,
    elements,
  });
}
export function validateCuratedQuality(doc, measure = approximateMeasure) {
  const issues = [...documentWarnings(doc, measure)];
  for (const e of doc.elements) {
    if (
      e.x < -0.01 ||
      e.y < -0.01 ||
      e.x + e.width > doc.canvas.width + 0.01 ||
      e.y + e.height > doc.canvas.height + 0.01
    )
      issues.push(`${e.id}: outside canvas`);
    if (e.type === "text" && !e.text.trim()) issues.push(`${e.id}: empty text`);
  }
  const text = doc.elements.filter((e) => e.type === "text");
  for (let i = 0; i < text.length; i++)
    for (let j = i + 1; j < text.length; j++) {
      const a = text[i],
        b = text[j];
      if (
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
      )
        issues.push(`${a.id}/${b.id}: overlapping text frames`);
    }
  return issues;
}
export function geometrySignature(doc) {
  return JSON.stringify(
    doc.elements.map((e) => [e.type, e.x, e.y, e.width, e.height, e.rotation]),
  );
}
