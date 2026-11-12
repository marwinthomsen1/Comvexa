import { createBlankDocument } from "../design-document/schema.js";
export const PRESETS = {
  square: [1080, 1080, "Instagram Square"],
  portrait: [1080, 1350, "Instagram Portrait"],
  story: [1080, 1920, "Instagram Story"],
  facebook: [1200, 630, "Facebook Post"],
  a4: [2480, 3508, "A4 Portrait · 300 ppi"],
  a4landscape: [3508, 2480, "A4 Landscape · 300 ppi"],
};
export const FONTS = ["Arial", "Georgia", "Verdana", "Courier New"];
export const MAX_BYTES = 20 * 1024 * 1024;
const color = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
const number = (v, min, max) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
function requireValue(ok, message) {
  if (!ok) throw new Error(message);
}
export function newDesign(
  name = "Untitled design",
  width = 1080,
  height = 1080,
) {
  return { ...createBlankDocument(width, height), name, assets: {} };
}
export function validateDocument(value) {
  requireValue(
    value && value.schemaVersion === 1,
    "Unsupported design version.",
  );
  const { canvas } = value;
  createBlankDocument(canvas?.width, canvas?.height);
  requireValue(color(canvas.background), "Invalid background color.");
  requireValue(
    typeof value.name === "string" &&
      value.name.trim().length > 0 &&
      value.name.length <= 80,
    "Design name must be 1–80 characters.",
  );
  requireValue(
    Array.isArray(value.elements) && value.elements.length <= 100,
    "A design supports up to 100 elements.",
  );
  requireValue(
    value.assets &&
      typeof value.assets === "object" &&
      !Array.isArray(value.assets),
    "Invalid image assets.",
  );
  const assets = {};
  requireValue(
    Object.keys(value.assets).length <= 30,
    "Use at most 30 image assets.",
  );
  for (const [id, a] of Object.entries(value.assets)) {
    requireValue(
      /^[a-zA-Z0-9-]{1,80}$/.test(id) &&
        a &&
        typeof a.src === "string" &&
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(a.src) &&
        a.src.length <= 12 * 1024 * 1024,
      "Only embedded PNG, JPG and WebP images are supported.",
    );
    requireValue(
      number(a.width, 1, 4096) &&
        number(a.height, 1, 4096) &&
        Number.isInteger(a.width) &&
        Number.isInteger(a.height),
      "Image dimensions exceed limits.",
    );
    assets[id] = { src: a.src, width: a.width, height: a.height };
  }
  const ids = new Set();
  const elements = value.elements.map((e) => {
    requireValue(
      e &&
        typeof e.id === "string" &&
        /^[a-zA-Z0-9-]{1,80}$/.test(e.id) &&
        !ids.has(e.id),
      "Element identifiers must be unique.",
    );
    ids.add(e.id);
    requireValue(
      ["text", "image", "rect", "ellipse"].includes(e.type),
      "Unsupported element type.",
    );
    for (const k of ["x", "y"])
      requireValue(number(e[k], -8192, 8192), "Position out of bounds.");
    for (const k of ["width", "height"])
      requireValue(
        number(e[k], 1, 8192),
        "Element size must be 1–8192 pixels.",
      );
    requireValue(
      number(e.rotation, -360, 360) &&
        number(e.opacity, 0, 1) &&
        typeof e.locked === "boolean",
      "Invalid element transform.",
    );
    requireValue(
      e.binding === null ||
        (e.binding &&
          typeof e.binding.fieldId === "string" &&
          e.binding.fieldId.length <= 80 &&
          typeof e.binding.campaignId === "string" &&
          e.binding.campaignId.length <= 80),
      "Invalid binding reference.",
    );
    requireValue(
      typeof e.localOverride === "boolean",
      "Explicit override flag is required.",
    );
    if (e.binding?.transform !== undefined)
      requireValue(
        ["plain", "uppercase"].includes(e.binding.transform),
        "Invalid connected text formatting.",
      );
    const out = {
      id: e.id,
      type: e.type,
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      rotation: e.rotation,
      opacity: e.opacity,
      locked: e.locked,
      binding: e.binding
        ? {
            fieldId: e.binding.fieldId,
            campaignId: e.binding.campaignId,
            ...(e.binding.transform ? { transform: e.binding.transform } : {}),
          }
        : null,
      localOverride: e.localOverride,
    };
    if (e.type === "text") {
      requireValue(
        typeof e.text === "string" &&
          e.text.length <= 5000 &&
          FONTS.includes(e.fontFamily) &&
          number(e.fontSize, 6, 600) &&
          ["normal", "bold"].includes(e.fontWeight) &&
          ["left", "center", "right"].includes(e.align) &&
          number(e.lineHeight, 0.5, 3) &&
          color(e.fill),
        "Invalid text style/content.",
      );
      Object.assign(out, {
        text: e.text,
        fontFamily: e.fontFamily,
        fontSize: e.fontSize,
        fontWeight: e.fontWeight,
        align: e.align,
        lineHeight: e.lineHeight,
        fill: e.fill,
      });
    } else if (e.type === "image") {
      const a = assets[e.assetId];
      requireValue(
        a &&
          e.crop &&
          number(e.crop.x, 0, 1) &&
          number(e.crop.y, 0, 1) &&
          number(e.crop.width, 0.01, 1) &&
          number(e.crop.height, 0.01, 1) &&
          e.crop.x + e.crop.width <= 1.00001 &&
          e.crop.y + e.crop.height <= 1.00001,
        "Invalid image or crop rectangle.",
      );
      Object.assign(out, {
        assetId: e.assetId,
        crop: {
          x: e.crop.x,
          y: e.crop.y,
          width: e.crop.width,
          height: e.crop.height,
        },
      });
    } else {
      requireValue(
        color(e.fill) &&
          color(e.stroke) &&
          number(e.strokeWidth, 0, 100) &&
          number(e.cornerRadius, 0, 1000),
        "Invalid shape style.",
      );
      Object.assign(out, {
        fill: e.fill,
        stroke: e.stroke,
        strokeWidth: e.strokeWidth,
        cornerRadius: e.cornerRadius,
      });
    }
    return out;
  });
  requireValue(
    Object.values(assets).reduce((sum, a) => sum + a.width * a.height, 0) <=
      24 * 1024 * 1024,
    "Combined images exceed the 24 megapixel budget.",
  );
  let provenance;
  if (value.provenance !== undefined) {
    const p = value.provenance;
    requireValue(
      p &&
        ["templateId", "campaignId", "ratio"].every(
          (k) => typeof p[k] === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(p[k]),
        ),
      "Invalid template provenance.",
    );
    provenance = {
      templateId: p.templateId,
      campaignId: p.campaignId,
      ratio: p.ratio,
    };
  }
  const result = {
    schemaVersion: 1,
    name: value.name.trim(),
    canvas: {
      width: canvas.width,
      height: canvas.height,
      background: canvas.background,
    },
    elements,
    assets: Object.fromEntries(
      Object.entries(assets).filter(([id]) =>
        elements.some((e) => e.assetId === id),
      ),
    ),
    bindings: [],
    ...(provenance ? { provenance } : {}),
  };
  requireValue(
    new TextEncoder().encode(JSON.stringify(result)).byteLength <= MAX_BYTES,
    "Design exceeds the 20 MB local/portable limit.",
  );
  return result;
}
export function makeElement(type, id) {
  const base = {
    id,
    type,
    x: 80,
    y: 80,
    width: 400,
    height: 240,
    rotation: 0,
    opacity: 1,
    locked: false,
    binding: null,
    localOverride: false,
  };
  if (type === "text")
    return {
      ...base,
      height: 180,
      text: "Your next big idea",
      fontFamily: "Arial",
      fontSize: 64,
      fontWeight: "bold",
      fill: "#272247",
      align: "left",
      lineHeight: 1.15,
    };
  return {
    ...base,
    fill: "#8955ed",
    stroke: "#3f2870",
    strokeWidth: 0,
    cornerRadius: 20,
  };
}
export function patchElement(doc, id, patch) {
  return validateDocument({
    ...doc,
    elements: doc.elements.map((e) =>
      e.id === id
        ? {
            ...e,
            ...patch,
            ...(e.binding &&
            (Object.hasOwn(patch, "text") || Object.hasOwn(patch, "assetId"))
              ? { localOverride: true }
              : {}),
          }
        : e,
    ),
  });
}
export function addElement(doc, element) {
  return validateDocument({ ...doc, elements: [...doc.elements, element] });
}
export function reorder(doc, id, direction) {
  const elements = [...doc.elements],
    i = elements.findIndex((e) => e.id === id),
    j = Math.max(0, Math.min(elements.length - 1, i + direction));
  if (i < 0) return doc;
  [elements[i], elements[j]] = [elements[j], elements[i]];
  return validateDocument({ ...doc, elements });
}
export function history(doc) {
  return { past: [], present: doc, future: [] };
}
function boundHistory(past, current) {
  past = past.slice(-30);
  while (past.length) {
    const sources = new Set(
      [current, ...past].flatMap((d) =>
        Object.values(d.assets).map((a) => a.src),
      ),
    );
    if (
      [...sources].reduce((sum, src) => sum + src.length, 0) <=
      48 * 1024 * 1024
    )
      break;
    past.shift();
  }
  return past;
}
export function commit(state, doc) {
  doc = validateDocument(doc);
  if (JSON.stringify(state.present) === JSON.stringify(doc)) return state;
  return {
    past: boundHistory([...state.past, state.present], doc),
    present: doc,
    future: [],
  };
}
export function undo(state) {
  if (!state.past.length) return state;
  return {
    past: state.past.slice(0, -1),
    present: state.past.at(-1),
    future: [state.present, ...state.future],
  };
}
export function redo(state) {
  if (!state.future.length) return state;
  return {
    past: [...state.past, state.present].slice(-30),
    present: state.future[0],
    future: state.future.slice(1),
  };
}
export function exportSpec(doc, format = "png", quality = 0.92) {
  validateDocument(doc);
  requireValue(
    ["png", "jpeg"].includes(format) && [0.8, 0.92, 1].includes(quality),
    "Unsupported export settings.",
  );
  return {
    width: doc.canvas.width,
    height: doc.canvas.height,
    mimeType: `image/${format}`,
    quality,
    pixelRatio: 1,
  };
}
export function snapPosition(e, doc, tolerance = 8) {
  let x = e.x,
    y = e.y;
  const guides = [];
  if (e.rotation !== 0) return { x, y, guides };
  for (const [axis, size] of [
    ["x", "width"],
    ["y", "height"],
  ]) {
    const targets = [
      0,
      doc.canvas[size] / 2,
      doc.canvas[size],
      ...doc.elements
        .filter((n) => n.id !== e.id)
        .flatMap((n) => [n[axis], n[axis] + n[size] / 2, n[axis] + n[size]]),
    ];
    let best = tolerance;
    let result = e[axis],
      guide;
    for (const t of targets)
      for (const offset of [0, e[size] / 2, e[size]]) {
        const delta = t - (e[axis] + offset);
        if (Math.abs(delta) < best) {
          best = Math.abs(delta);
          result = e[axis] + delta;
          guide = t;
        }
      }
    if (axis === "x") x = result;
    else y = result;
    if (guide !== undefined) guides.push({ axis, position: guide });
  }
  return { x, y, guides };
}
