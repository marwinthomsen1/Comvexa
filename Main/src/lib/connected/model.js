import { validateDocument } from "../editor/document.js";
const ID = /^[a-zA-Z0-9.-]{1,80}$/;
const DEFAULTS = {
  name: "Product or event name",
  description: "Description",
  price: "Price",
  currency: "Currency",
  dates: "Dates",
  phone: "Phone number",
  address: "Address",
  website: "Website",
  social: "Social media",
  contact: "Contact details",
  link: "Website or social link",
};
function check(ok, message) {
  if (!ok) throw new Error(message);
}
function safeText(v, max, label) {
  check(
    typeof v === "string" &&
      v.length <= max &&
      ![...v].some(
        (c) => c.charCodeAt(0) < 32 && ![9, 10, 13].includes(c.charCodeAt(0)),
      ),
    `Invalid ${label}.`,
  );
  return v;
}
export function normalizeCampaign(input, documents = []) {
  check(
    input &&
      typeof input.id === "string" &&
      ID.test(input.id) &&
      typeof input.name === "string" &&
      input.name.trim() &&
      input.name.length <= 160,
    "Invalid campaign document.",
  );
  const fields = input.fields || {},
    assets = { ...input.assets };
  for (const doc of documents)
    for (const [id, a] of Object.entries(doc.assets || {}))
      if (!assets[id]) assets[id] = a;
  let sharedFields;
  if (input.connectedVersion !== undefined) {
    check(
      input.connectedVersion === 1 && Array.isArray(input.sharedFields),
      "Unsupported campaign schema.",
    );
    sharedFields = input.sharedFields;
  } else {
    sharedFields = Object.entries(DEFAULTS).map(([id, label]) => ({
      id,
      label,
      type: "text",
      value: fields[id] || "",
    }));
    const photos = input.photoIds?.length
      ? input.photoIds
      : [input.assetId].filter(Boolean);
    if (photos.length > 1)
      photos.forEach((id, index) =>
        sharedFields.push({
          id: `photos.${index}`,
          label: `Photo ${index + 1}`,
          type: "image",
          value: id,
        }),
      );
    else if (photos[0])
      sharedFields.push({
        id: "photo",
        label: "Campaign photo",
        type: "image",
        value: photos[0],
      });
  }
  check(
    sharedFields.length <= 50,
    "A campaign supports up to 50 shared fields.",
  );
  const ids = new Set();
  sharedFields = sharedFields.map((f) => {
    check(
      f && typeof f.id === "string" && ID.test(f.id) && !ids.has(f.id),
      "Shared field IDs must be unique.",
    );
    ids.add(f.id);
    check(["text", "image"].includes(f.type), "Invalid field type.");
    safeText(f.label, 80, "field label");
    check(f.label.trim(), "Field labels cannot be empty.");
    safeText(f.value, f.type === "text" ? 5000 : 80, "field value");
    return { id: f.id, label: f.label.trim(), type: f.type, value: f.value };
  });
  const usedAssets = {};
  for (const f of sharedFields.filter((f) => f.type === "image")) {
    const a = assets[f.value];
    if (a) {
      validateDocument({
        schemaVersion: 1,
        name: "Campaign asset validation",
        canvas: { width: 64, height: 64, background: "#ffffff" },
        bindings: [],
        assets: { [f.value]: a },
        elements: [
          {
            id: "image-validation",
            type: "image",
            x: 0,
            y: 0,
            width: 64,
            height: 64,
            rotation: 0,
            opacity: 1,
            locked: false,
            binding: null,
            localOverride: false,
            assetId: f.value,
            crop: { x: 0, y: 0, width: 1, height: 1 },
          },
        ],
      });
      usedAssets[f.value] = a;
    }
  }
  check(
    Number.isInteger(input.revision ?? 0) && (input.revision ?? 0) >= 0,
    "Invalid campaign revision.",
  );
  const cleanFields = {};
  for (const [key] of Object.entries(DEFAULTS)) {
    const f = sharedFields.find((f) => f.id === key && f.type === "text");
    cleanFields[key] = f?.value || "";
  }
  for (const key of ["background", "ink", "accent"])
    cleanFields[key] = /^#[0-9a-f]{6}$/i.test(fields[key])
      ? fields[key]
      : key === "background"
        ? "#ffffff"
        : key === "ink"
          ? "#272247"
          : "#8955ed";
  cleanFields.styleId =
    typeof fields.styleId === "string" && ID.test(fields.styleId)
      ? fields.styleId
      : "fashion";
  check(
    Object.values(usedAssets).reduce((n, a) => n + a.width * a.height, 0) <=
      24 * 1024 * 1024,
    "Campaign images exceed the pixel budget.",
  );
  check(
    JSON.stringify(usedAssets).length <= 20 * 1024 * 1024,
    "Campaign images exceed the storage budget.",
  );
  return {
    id: input.id,
    name: input.name,
    createdAt:
      typeof input.createdAt === "string"
        ? input.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof input.updatedAt === "string" ? input.updatedAt : undefined,
    styleId: cleanFields.styleId,
    connectedVersion: 1,
    revision: input.revision ?? 0,
    fields: cleanFields,
    sharedFields,
    assets: usedAssets,
    designIds: Array.isArray(input.designIds)
      ? input.designIds.filter((id) => typeof id === "string" && ID.test(id))
      : [],
  };
}
export function fieldValue(campaign, id) {
  const f = campaign.sharedFields.find((f) => f.id === id);
  check(
    f,
    `Missing campaign field “${id}”. Restore or remove its connection before saving/exporting.`,
  );
  return f;
}
export function inferTransform(element, campaign) {
  if (element.binding?.transform) return element.binding.transform;
  const f = campaign.sharedFields.find(
    (f) => f.id === element.binding?.fieldId,
  );
  if (
    element.type === "text" &&
    f?.value &&
    element.text.replace(/\s/g, "") ===
      f.value.toUpperCase().replace(/\s/g, "") &&
    f.value !== f.value.toUpperCase()
  )
    return "uppercase";
  return "plain";
}
export function adaptSharedCrop(crop, oldAsset, newAsset, width, height) {
  if (
    !oldAsset ||
    Math.abs(
      oldAsset.width / oldAsset.height - newAsset.width / newAsset.height,
    ) < 0.00001
  )
    return crop;
  const cover = (asset) => {
    const source = asset.width / asset.height,
      target = width / height;
    return source > target
      ? { width: target / source, height: 1 }
      : { width: 1, height: source / target };
  };
  const oldCover = cover(oldAsset),
    next = cover(newAsset),
    factor = Math.min(
      crop.width / oldCover.width,
      crop.height / oldCover.height,
    );
  const w = Math.min(1, next.width * factor),
    h = Math.min(1, next.height * factor),
    cx = crop.x + crop.width / 2,
    cy = crop.y + crop.height / 2;
  return {
    x: Math.max(0, Math.min(1 - w, cx - w / 2)),
    y: Math.max(0, Math.min(1 - h, cy - h / 2)),
    width: w,
    height: h,
  };
}
export function resolveDocument(document, campaigns, { strict = true } = {}) {
  const doc = validateDocument(document),
    warnings = [],
    revisions = {};
  let assets = { ...doc.assets };
  const elements = doc.elements.map((e) => {
    if (!e.binding) return e;
    const c = campaigns.find((c) => c.id === e.binding.campaignId);
    if (!c) {
      const message = `Campaign “${e.binding.campaignId}” is unavailable. Cached content was kept. Remove the connection or import its campaign.`;
      if (strict) throw new Error(message);
      warnings.push(message);
      return e;
    }
    revisions[c.id] = c.revision;
    const f = c.sharedFields.find((f) => f.id === e.binding.fieldId);
    if (!f) {
      const message = `Field “${e.binding.fieldId}” is missing. Cached content was kept; remove or restore the connection.`;
      if (strict) throw new Error(message);
      warnings.push(message);
      return e;
    }
    check(
      (e.type === "text" && f.type === "text") ||
        (e.type === "image" && f.type === "image"),
      "Connected element and field types do not match.",
    );
    const binding = { ...e.binding, transform: inferTransform(e, c) };
    if (e.localOverride) return { ...e, binding };
    if (e.type === "text")
      return {
        ...e,
        binding,
        text:
          binding.transform === "uppercase" ? f.value.toUpperCase() : f.value,
      };
    const asset = c.assets[f.value];
    if (!asset) {
      const message = `Shared image “${f.label}” is unavailable. Cached image was kept.`;
      if (strict) throw new Error(message);
      warnings.push(message);
      return { ...e, binding };
    }
    assets[f.value] = asset;
    return {
      ...e,
      binding,
      assetId: f.value,
      crop: adaptSharedCrop(
        e.crop,
        doc.assets[e.assetId],
        asset,
        e.width,
        e.height,
      ),
    };
  });
  return {
    document: validateDocument({ ...doc, elements, assets }),
    warnings: [...new Set(warnings)],
    revisions,
  };
}
export function connectElement(document, elementId, campaign, fieldId) {
  check(
    !document.elements.some(
      (e) =>
        e.id !== elementId && e.binding && e.binding.campaignId !== campaign.id,
    ),
    "A design can connect to one campaign. Remove its existing connections before choosing another campaign.",
  );
  const f = fieldValue(campaign, fieldId),
    e = document.elements.find((e) => e.id === elementId);
  check(
    e &&
      ((e.type === "text" && f.type === "text") ||
        (e.type === "image" && f.type === "image")),
    "Choose a matching campaign field.",
  );
  return resolveDocument(
    {
      ...document,
      elements: document.elements.map((e) =>
        e.id === elementId
          ? {
              ...e,
              binding: { campaignId: campaign.id, fieldId, transform: "plain" },
              localOverride: false,
            }
          : e,
      ),
    },
    [campaign],
  ).document;
}
export function connectionAction(document, elementId, action, campaigns) {
  const e = document.elements.find((e) => e.id === elementId);
  check(e?.binding, "Select a connected element.");
  if (action === "detach")
    return validateDocument({
      ...document,
      elements: document.elements.map((n) =>
        n.id === elementId ? { ...n, binding: null, localOverride: false } : n,
      ),
    });
  check(["override", "restore"].includes(action), "Unknown connection action.");
  const next = {
    ...document,
    elements: document.elements.map((n) =>
      n.id === elementId ? { ...n, localOverride: action === "override" } : n,
    ),
  };
  return action === "restore"
    ? resolveDocument(next, campaigns).document
    : validateDocument(next);
}
export function planUpdate(
  current,
  nextInput,
  records,
  { detachFields = [] } = {},
) {
  const next = normalizeCampaign(
    { ...nextInput, id: current.id, revision: current.revision + 1 },
    records.map((r) => r.document),
  );
  const removed = current.sharedFields
    .filter((f) => !next.sharedFields.some((n) => n.id === f.id))
    .map((f) => f.id);
  for (const id of removed) {
    if (
      records.some((r) =>
        r.document.elements.some(
          (e) =>
            e.binding?.campaignId === current.id && e.binding.fieldId === id,
        ),
      ) &&
      !detachFields.includes(id)
    )
      throw new Error(
        "This field is used by designs. Choose remove and detach to keep their current content.",
      );
  }
  const updated = records.map((record) => {
    const base = resolveDocument(record.document, [current], {
      strict: false,
    }).document;
    const elements = base.elements.map((e) =>
      e.binding?.campaignId === current.id &&
      removed.includes(e.binding.fieldId)
        ? { ...e, binding: null, localOverride: false }
        : e,
    );
    const result = resolveDocument({ ...base, elements }, [next], {
      strict: false,
    });
    if (result.warnings.length) throw new Error(result.warnings[0]);
    return { ...record, document: result.document };
  });
  next.name =
    next.sharedFields.find((f) => f.id === "name")?.value.slice(0, 160) ||
    current.name;
  for (const f of next.sharedFields)
    if (Object.hasOwn(DEFAULTS, f.id) && f.type === "text")
      next.fields[f.id] = f.value;
  return { campaign: next, records: updated };
}
export function portableEnvelope(document, campaigns) {
  const resolved = resolveDocument(document, campaigns);
  return {
    kind: "comvexa-connected-project",
    version: 1,
    document: resolved.document,
    campaigns: campaigns.map((c) => normalizeCampaign(c, [document])),
    campaignRevisions: resolved.revisions,
  };
}
export const MAX_PORTABLE_BYTES = 64 * 1024 * 1024;
export function parsePortable(input) {
  check(
    new TextEncoder().encode(JSON.stringify(input)).byteLength <=
      MAX_PORTABLE_BYTES,
    "Portable project exceeds 64 MB.",
  );
  if (input?.kind !== "comvexa-connected-project")
    return { document: validateDocument(input), campaigns: [] };
  check(
    input.version === 1 &&
      Array.isArray(input.campaigns) &&
      input.campaigns.length <= 10,
    "Invalid connected project file.",
  );
  const doc = validateDocument(input.document);
  const campaigns = input.campaigns.map((c) => normalizeCampaign(c, [doc]));
  check(
    new Set(campaigns.map((c) => c.id)).size === campaigns.length,
    "Duplicate portable campaigns.",
  );
  return { document: resolveDocument(doc, campaigns).document, campaigns };
}
