import {
  newDesign,
  makeElement,
  validateDocument,
} from "../editor/document.js";
import { getFamily, getTemplate, RATIOS } from "./catalog.js";
import { fitText, coverCrop } from "./fitting.js";
const LIMITS = {
  name: 160,
  description: 600,
  price: 80,
  contact: 120,
  link: 160,
};
export function validateCampaign(input) {
  const fields = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = input?.[key] ?? "";
    if (
      typeof value !== "string" ||
      value.length > max ||
      [...value].some(
        (c) => c.charCodeAt(0) < 32 && ![9, 10, 13].includes(c.charCodeAt(0)),
      )
    )
      throw new Error(`${key} must be text up to ${max} characters.`);
    fields[key] = value.trim();
  }
  if (!fields.name) throw new Error("Enter a product or event name.");
  for (const key of ["background", "ink", "accent"]) {
    if (!/^#[0-9a-f]{6}$/i.test(input?.[key]))
      throw new Error("Choose valid six-digit colors.");
    fields[key] = input[key];
  }
  getFamily(input.styleId);
  return { ...fields, styleId: input.styleId };
}
export function generateDesign({
  templateId,
  campaignId,
  fields,
  asset,
  assetId,
  measure,
}) {
  const t = getTemplate(templateId),
    f = getFamily(t.familyId);
  fields = validateCampaign(fields);
  if (
    typeof campaignId !== "string" ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(campaignId)
  )
    throw new Error("Invalid campaign reference.");
  const { width: w, height: h } = RATIOS[t.ratio],
    land = t.ratio === "landscape",
    story = t.ratio === "story",
    short = t.ratio === "square";
  if (
    asset &&
    (typeof assetId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(assetId))
  )
    throw new Error("Image assets require a stable identifier.");
  const doc = newDesign(`${fields.name.slice(0, 52)} · ${t.ratio}`, w, h);
  doc.canvas.background = fields.background;
  const elements = [],
    warnings = [];
  let seq = 0;
  const id = () => `el-${t.id}-${++seq}`;
  function shape(
    x,
    y,
    width,
    height,
    fill,
    radius = 0,
    type = "rect",
    rotation = 0,
  ) {
    elements.push({
      ...makeElement(type, id()),
      x,
      y,
      width,
      height,
      fill,
      cornerRadius: radius,
      rotation,
    });
  }
  function text(field, value, x, y, width, height, max = 70, opts = {}) {
    if (!value) return;
    const fitted = fitText(
      value,
      { width, height },
      {
        font: opts.font || f.font,
        weight: opts.weight || "normal",
        max,
        min: Math.min(max, opts.min || 22),
        lineHeight: opts.lineHeight || 1.1,
        measure,
      },
    );
    if (fitted.overflow)
      warnings.push(
        `${field}: content does not fit the ${t.ratio} layout. Shorten it before saving.`,
      );
    elements.push({
      ...makeElement("text", id()),
      x,
      y,
      width,
      height,
      ...fitted,
      fontFamily: opts.font || f.font,
      fontWeight: opts.weight || "normal",
      align: opts.align || "left",
      fill: opts.color || fields.ink,
      binding: opts.static ? null : { campaignId, fieldId: field },
      localOverride: false,
    });
  }
  function photo(x, y, width, height) {
    if (!asset) {
      warnings.push("No photo available. Add a photo before generating.");
      return;
    }
    doc.assets[assetId] = asset;
    elements.push({
      ...makeElement("image", id()),
      x,
      y,
      width,
      height,
      assetId,
      crop: coverCrop(asset, width, height),
      binding: { campaignId, fieldId: "photo" },
      localOverride: false,
    });
  }
  const margin = land ? 55 : 70;
  // Deliberately curated compositions per category, with ratio-specific reflow.
  if (f.id === "fashion") {
    photo(land ? w * 0.48 : w * 0.23, 0, land ? w * 0.52 : w * 0.77, h * 0.8);
    shape(0, h * 0.68, w, h * 0.32, fields.accent);
    text(
      "name",
      fields.name,
      margin,
      land ? 100 : h * 0.44,
      land ? w * 0.48 : w * 0.82,
      land ? 230 : h * 0.25,
      land ? 85 : 110,
      { weight: "bold", color: "#ffffff" },
    );
  } else if (f.id === "food") {
    photo(
      land ? w * 0.48 : 0,
      land ? 0 : h * 0.24,
      land ? w * 0.52 : w,
      land ? h : h * 0.59,
    );
    shape(0, 0, land ? w * 0.48 : w, land ? h : h * 0.28, fields.background);
    shape(
      margin,
      h * (land ? 0.7 : 0.76),
      land ? w * 0.32 : w - margin * 2,
      h * (land ? 0.115 : 0.15),
      fields.accent,
      38,
    );
    text(
      "name",
      fields.name,
      margin,
      land ? 105 : 80,
      land ? w * 0.38 : w * 0.87,
      land ? 230 : h * 0.19,
      land ? 83 : 100,
      { weight: "bold" },
    );
  } else if (f.id === "beauty") {
    photo(
      land ? w * 0.52 : w * 0.28,
      land ? 0 : h * 0.22,
      land ? w * 0.48 : w * 0.72,
      land ? h : h * 0.64,
    );
    shape(0, 0, land ? w * 0.5 : w, h * (land ? 1 : 0.24), fields.background);
    text(
      "name",
      fields.name,
      margin,
      land ? 120 : 100,
      land ? w * 0.42 : w * 0.79,
      land ? 220 : h * 0.23,
      land ? 87 : 105,
      { font: "Georgia" },
    );
    shape(margin, h * 0.69, land ? w * 0.32 : w * 0.25, 8, fields.accent);
  } else if (f.id === "electronics") {
    shape(w * 0.4, -h * 0.1, w * 0.7, h * 0.7, fields.accent, 80, "rect", 12);
    photo(
      land ? w * 0.55 : w * 0.27,
      land ? 80 : h * 0.24,
      land ? w * 0.4 : w * 0.65,
      land ? h * 0.76 : h * 0.45,
    );
    text(
      "name",
      fields.name,
      margin,
      land ? 85 : 100,
      land ? w * 0.48 : w * 0.82,
      land ? 210 : h * 0.23,
      land ? 88 : 110,
      { weight: "bold" },
    );
    shape(
      margin,
      h * 0.7,
      land ? w * 0.3 : w * 0.52,
      h * 0.12,
      fields.accent,
      28,
    );
  } else if (f.id === "motors") {
    photo(
      land ? w * 0.4 : 0,
      land ? 0 : h * 0.27,
      land ? w * 0.6 : w,
      land ? h : h * 0.48,
    );
    shape(0, 0, land ? w * 0.4 : w, land ? h : h * 0.29, fields.background);
    text(
      "name",
      fields.name.toUpperCase(),
      margin,
      land ? 110 : 90,
      land ? w * 0.32 : w * 0.86,
      land ? 220 : h * 0.2,
      land ? 74 : 105,
      { weight: "bold" },
    );
    shape(0, h * 0.77, w, 12, fields.accent);
  } else if (f.id === "travel") {
    photo(0, 0, w, land ? h : h * 0.66);
    shape(
      land ? margin : 0,
      land ? 55 : h * 0.5,
      land ? w * 0.42 : w,
      land ? h - 110 : h * 0.5,
      fields.background,
      land ? 10 : 0,
    );
    text(
      "name",
      fields.name,
      land ? 95 : margin,
      land ? 100 : h * 0.55,
      land ? w * 0.35 : w * 0.84,
      land ? 220 : h * 0.2,
      land ? 85 : 110,
      { font: "Georgia" },
    );
  } else if (f.id === "birthday") {
    shape(-100, -100, w * 0.55, w * 0.55, fields.accent, 300, "ellipse");
    shape(w * 0.75, h * 0.75, w * 0.4, w * 0.4, "#b4e2d3", 300, "ellipse");
    photo(
      land ? w * 0.64 : w * 0.32,
      land ? 80 : h * 0.12,
      land ? w * 0.29 : w * 0.36,
      land ? h * 0.66 : h * 0.2,
    );
    text(
      "name",
      fields.name,
      land ? margin : margin,
      land ? 120 : h * 0.36,
      land ? w * 0.51 : w * 0.86,
      land ? 190 : h * 0.21,
      land ? 88 : 110,
      { font: "Georgia", align: land ? "left" : "center" },
    );
  } else {
    shape(w * 0.55, -80, w * 0.7, h * 0.7, fields.accent, 60, "rect", 15);
    photo(
      land ? w * 0.62 : w * 0.6,
      land ? 80 : h * 0.09,
      land ? w * 0.3 : w * 0.32,
      land ? h * 0.66 : h * 0.27,
    );
    text(
      "name",
      fields.name.toUpperCase(),
      margin,
      land ? 110 : h * 0.34,
      land ? w * 0.53 : w * 0.86,
      land ? 230 : h * 0.27,
      land ? 90 : 130,
      { weight: "bold", lineHeight: 1 },
    );
    shape(0, h * 0.79, w, h * 0.21, fields.accent);
  }
  let descY = land ? h * 0.59 : h * 0.77,
    footerY = land ? h * 0.83 : h * 0.92;
  if (f.id === "fashion") descY = land ? h * 0.55 : h * 0.74;
  if (f.id === "food") descY = land ? h * 0.58 : h * 0.84;
  if (f.id === "beauty") descY = land ? h * 0.58 : h * 0.81;
  if (f.id === "electronics") descY = land ? h * 0.59 : h * 0.82;
  if (f.id === "travel") descY = land ? h * 0.58 : h * 0.77;
  if (f.id === "birthday") descY = land ? h * 0.55 : h * 0.61;
  if (f.id === "events") descY = land ? h * 0.6 : h * 0.81;
  const descWidth = land
    ? w * (f.id === "food" || f.id === "motors" ? 0.32 : 0.4)
    : w * 0.84;
  text(
    "description",
    fields.description,
    margin,
    descY,
    descWidth,
    land
      ? 65
      : h *
          (f.id === "birthday"
            ? 0.17
            : f.id === "food"
              ? 0.06
              : f.id === "electronics"
                ? 0.07
                : 0.1),
    land ? 27 : short ? 29 : story ? 43 : 34,
    {
      min: 18,
      color:
        f.id === "fashion"
          ? "#ffffff"
          : f.id === "food" && !land
            ? fields.ink
            : fields.ink,
      align: f.id === "birthday" && !land ? "center" : "left",
    },
  );
  const priceY = land
    ? h * 0.72
    : h *
      (f.id === "food"
        ? 0.775
        : f.id === "electronics"
          ? 0.72
          : f.id === "birthday"
            ? 0.8
            : f.id === "events" || f.id === "beauty"
              ? 0.73
              : 0.87);
  text(
    "price",
    fields.price,
    margin + (f.id === "food" && !land ? 25 : 0),
    priceY,
    land ? w * 0.34 : w * 0.82,
    land ? 55 : h * (f.id === "food" ? 0.055 : 0.05),
    land ? 38 : 48,
    {
      weight: "bold",
      min: 20,
      color: ["food", "electronics"].includes(f.id)
        ? "#17182a"
        : f.id === "fashion"
          ? "#ffffff"
          : fields.ink,
    },
  );
  if (f.id === "events") {
    const e = elements.find((e) => e.binding?.fieldId === "description");
    if (e) e.fill = land ? fields.ink : "#262096";
  }
  // Contact and link get separate frames: neither is silently discarded.
  const footerWidth = land ? w * 0.43 : w * 0.84;
  text(
    "contact",
    fields.contact,
    margin,
    footerY,
    footerWidth,
    land ? 30 : h * 0.033,
    land ? 22 : 24,
    {
      min: 16,
      color:
        f.id === "events" && !land
          ? "#262096"
          : f.id === "fashion"
            ? "#ffffff"
            : fields.ink,
    },
  );
  text(
    "link",
    fields.link,
    margin,
    footerY + (land ? 34 : h * 0.036),
    footerWidth,
    land ? 30 : h * 0.033,
    land ? 21 : 23,
    {
      min: 15,
      color:
        f.id === "events" && !land
          ? "#262096"
          : f.id === "fashion"
            ? "#ffffff"
            : fields.ink,
    },
  );
  text(
    "label",
    f.category.toUpperCase(),
    margin,
    30,
    land ? w * 0.45 : w * 0.7,
    35,
    20,
    { font: "Arial", weight: "bold", static: true },
  );
  doc.elements = elements;
  doc.provenance = { templateId: t.id, campaignId, ratio: t.ratio };
  return {
    document: validateDocument(doc),
    warnings,
    templateId: t.id,
    ratio: t.ratio,
  };
}
export function generatePackage({
  campaignId,
  fields,
  asset,
  assetId,
  measure,
  photos,
  idFactory = () => crypto.randomUUID(),
}) {
  fields = validateCampaign(fields);
  if (photos !== undefined && (!Array.isArray(photos) || photos.length > 4))
    throw new Error("Choose up to four photos.");
  const designs = Object.keys(RATIOS).map((ratio, index) => {
    const selected = photos?.length
      ? photos[index % photos.length]
      : { asset, id: assetId };
    const result = generateDesign({
      templateId: `${fields.styleId}-${ratio}`,
      campaignId,
      fields,
      asset: selected.asset,
      assetId: selected.id,
      measure,
    });
    if (photos?.length > 1)
      for (const element of result.document.elements)
        if (element.type === "image")
          element.binding.fieldId = `photos.${index % photos.length}`;
    return { id: idFactory(), ...result };
  });
  return {
    campaign: {
      id: campaignId,
      name: fields.name,
      fields,
      assetId,
      photoIds: photos?.map((p) => p.id) || [assetId],
      styleId: fields.styleId,
      createdAt: new Date().toISOString(),
      designIds: designs.map((d) => d.id),
    },
    designs,
    warnings: designs.flatMap((d) =>
      d.warnings.map((w) => `${RATIOS[d.ratio].label}: ${w}`),
    ),
  };
}
