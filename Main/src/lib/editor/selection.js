import { validateDocument } from "./document.js";
// Flat membership keeps artwork/world transforms independent of renderer state.
export function expandSelection(doc, ids) {
  const selected = new Set(ids);
  const groups = new Set(
    doc.elements
      .filter((e) => selected.has(e.id) && e.groupId)
      .map((e) => e.groupId),
  );
  return doc.elements
    .filter((e) => selected.has(e.id) || groups.has(e.groupId))
    .map((e) => e.id);
}
export function editableIds(doc, ids) {
  const expanded = expandSelection(doc, ids);
  const blocked = new Set(
    doc.elements
      .filter((e) => e.groupId && (e.locked || e.hidden))
      .map((e) => e.groupId),
  );
  return expanded.filter((id) => {
    const e = doc.elements.find((e) => e.id === id);
    return e && !e.locked && !e.hidden && !blocked.has(e.groupId);
  });
}
export function selectElement(doc, current, id, additive = false) {
  if (!id) return [];
  const target = expandSelection(doc, [id]);
  if (!additive) return target;
  return target.every((id) => current.includes(id))
    ? current.filter((id) => !target.includes(id))
    : [...new Set([...current, ...target])];
}
export function elementBounds(e) {
  const r = (e.rotation * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  if (e.type === "ellipse") {
    const rx = e.width / 2,
      ry = e.height / 2,
      cx = e.x + rx * c - ry * s,
      cy = e.y + rx * s + ry * c;
    const halfWidth = Math.sqrt(rx * rx * c * c + ry * ry * s * s),
      halfHeight = Math.sqrt(rx * rx * s * s + ry * ry * c * c);
    return {
      x: cx - halfWidth,
      y: cy - halfHeight,
      width: 2 * halfWidth,
      height: 2 * halfHeight,
    };
  }
  const corners = [
    [0, 0],
    [e.width, 0],
    [0, e.height],
    [e.width, e.height],
  ].map(([x, y]) => ({ x: e.x + x * c - y * s, y: e.y + x * s + y * c }));
  const x = Math.min(...corners.map((p) => p.x)),
    y = Math.min(...corners.map((p) => p.y));
  return {
    x,
    y,
    width: Math.max(...corners.map((p) => p.x)) - x,
    height: Math.max(...corners.map((p) => p.y)) - y,
  };
}
export function bounds(elements) {
  if (!elements.length) return { x: 0, y: 0, width: 0, height: 0 };
  const boxes = elements.map(elementBounds),
    x = Math.min(...boxes.map((e) => e.x)),
    y = Math.min(...boxes.map((e) => e.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((e) => e.x + e.width)) - x,
    height: Math.max(...boxes.map((e) => e.y + e.height)) - y,
  };
}
export function marqueeSelection(doc, rect, initial = []) {
  return expandSelection(doc, [
    ...initial,
    ...doc.elements
      .filter((e) => {
        const b = elementBounds(e);
        return (
          !e.locked &&
          !e.hidden &&
          b.x >= rect.x &&
          b.y >= rect.y &&
          b.x + b.width <= rect.x + rect.width &&
          b.y + b.height <= rect.y + rect.height
        );
      })
      .map((e) => e.id),
  ]);
}
function cleaned(doc, elements) {
  const counts = new Map();
  for (const e of elements)
    if (e.groupId) counts.set(e.groupId, (counts.get(e.groupId) || 0) + 1);
  return validateDocument({
    ...doc,
    elements: elements.map((e) => {
      if (e.groupId && counts.get(e.groupId) < 2) {
        const item = { ...e };
        delete item.groupId;
        return item;
      }
      return e;
    }),
  });
}
export function patchSelection(
  doc,
  ids,
  patch,
  { includeProtected = false } = {},
) {
  const targets = new Set(
    includeProtected ? expandSelection(doc, ids) : editableIds(doc, ids),
  );
  return validateDocument({
    ...doc,
    schemaVersion: Object.hasOwn(patch, "hidden") ? 2 : doc.schemaVersion,
    elements: doc.elements.map((e) =>
      targets.has(e.id) ? { ...e, ...patch } : e,
    ),
  });
}
export function groupSelection(doc, ids, groupId) {
  const targets = editableIds(doc, ids);
  if (targets.length < 2)
    throw new Error("Select at least two unlocked, visible elements to group.");
  // Membership is one-level. Regrouping merges selected groups without nesting.
  const selected = doc.elements.filter((e) => targets.includes(e.id));
  const remaining = doc.elements.filter((e) => !targets.includes(e.id));
  const insert = doc.elements
    .slice(
      0,
      doc.elements.findIndex((e) => targets.includes(e.id)),
    )
    .filter((e) => !targets.includes(e.id)).length;
  remaining.splice(insert, 0, ...selected.map((e) => ({ ...e, groupId })));
  return validateDocument({ ...doc, schemaVersion: 2, elements: remaining });
}
export function ungroupSelection(doc, ids) {
  const targets = new Set(editableIds(doc, ids));
  return cleaned(
    doc,
    doc.elements.map((e) => {
      if (!targets.has(e.id)) return e;
      const item = { ...e };
      delete item.groupId;
      return item;
    }),
  );
}
export function deleteSelection(doc, ids) {
  const targets = new Set(editableIds(doc, ids));
  return cleaned(
    doc,
    doc.elements.filter((e) => !targets.has(e.id)),
  );
}
export function moveSelection(doc, ids, dx, dy) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy))
    throw new Error("Invalid move.");
  const targets = new Set(editableIds(doc, ids));
  return validateDocument({
    ...doc,
    elements: doc.elements.map((e) =>
      targets.has(e.id) ? { ...e, x: e.x + dx, y: e.y + dy } : e,
    ),
  });
}
export function transformSelection(
  doc,
  ids,
  { scale = 1, rotation = 0, dx = 0, dy = 0, origin } = {},
) {
  if (![scale, rotation, dx, dy].every(Number.isFinite) || scale <= 0)
    throw new Error("Invalid selection transform.");
  const targets = new Set(editableIds(doc, ids)),
    box = bounds(doc.elements.filter((e) => targets.has(e.id)));
  const o = origin || { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    r = (rotation * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return validateDocument({
    ...doc,
    elements: doc.elements.map((e) => {
      if (!targets.has(e.id)) return e;
      const x = (e.x - o.x) * scale,
        y = (e.y - o.y) * scale;
      return {
        ...e,
        x: o.x + x * c - y * s + dx,
        y: o.y + x * s + y * c + dy,
        width: e.width * scale,
        height: e.height * scale,
        rotation: (((e.rotation + rotation) % 360) + 360) % 360,
        ...(e.type === "text" ? { fontSize: e.fontSize * scale } : {}),
        ...(e.type === "rect" || e.type === "ellipse"
          ? {
              strokeWidth: e.strokeWidth * scale,
              cornerRadius: e.cornerRadius * scale,
            }
          : {}),
      };
    }),
  });
}
function units(doc, ids) {
  const targets = editableIds(doc, ids),
    seen = new Set(),
    out = [];
  for (const e of doc.elements.filter((e) => targets.includes(e.id))) {
    const key = e.groupId || e.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const items = doc.elements.filter(
      (n) =>
        targets.includes(n.id) &&
        (e.groupId ? n.groupId === e.groupId : n.id === e.id),
    );
    out.push({ ids: items.map((e) => e.id), ...bounds(items) });
  }
  return out;
}
export function alignSelection(doc, ids, mode) {
  const list = units(doc, ids);
  if (!list.length) return doc;
  const all = bounds(
    doc.elements.filter((e) => list.some((u) => u.ids.includes(e.id))),
  );
  const target =
    mode.startsWith("canvas-") || list.length === 1
      ? { x: 0, y: 0, width: doc.canvas.width, height: doc.canvas.height }
      : all;
  const kind = mode.replace("canvas-", "");
  if (!["left", "center", "right", "top", "middle", "bottom"].includes(kind))
    throw new Error("Unknown alignment.");
  let result = doc;
  for (const u of list) {
    let dx = 0,
      dy = 0;
    if (kind === "left") dx = target.x - u.x;
    if (kind === "center") dx = target.x + target.width / 2 - u.x - u.width / 2;
    if (kind === "right") dx = target.x + target.width - u.x - u.width;
    if (kind === "top") dy = target.y - u.y;
    if (kind === "middle")
      dy = target.y + target.height / 2 - u.y - u.height / 2;
    if (kind === "bottom") dy = target.y + target.height - u.y - u.height;
    result = moveSelection(result, u.ids, dx, dy);
  }
  return result;
}
export function distributeSelection(doc, ids, axis) {
  if (!["x", "y"].includes(axis)) throw new Error("Unknown distribution.");
  const list = units(doc, ids).sort((a, b) => a[axis] - b[axis]);
  if (list.length < 3)
    throw new Error(
      "Select at least three independent objects or groups to distribute.",
    );
  const size = axis === "x" ? "width" : "height",
    first = list[0],
    last = list.at(-1);
  const gap =
    (last[axis] +
      last[size] -
      first[axis] -
      list.reduce((n, u) => n + u[size], 0)) /
    (list.length - 1);
  let cursor = first[axis],
    result = doc;
  for (const u of list) {
    result = moveSelection(
      result,
      u.ids,
      axis === "x" ? cursor - u.x : 0,
      axis === "y" ? cursor - u.y : 0,
    );
    cursor += u[size] + gap;
  }
  return result;
}
export function reorderSelection(doc, ids, direction) {
  const targets = new Set(editableIds(doc, ids)),
    elements = [...doc.elements];
  if (direction > 0) {
    for (let i = elements.length - 2; i >= 0; i--)
      if (targets.has(elements[i].id) && !targets.has(elements[i + 1].id))
        [elements[i], elements[i + 1]] = [elements[i + 1], elements[i]];
  } else {
    for (let i = 1; i < elements.length; i++)
      if (targets.has(elements[i].id) && !targets.has(elements[i - 1].id))
        [elements[i], elements[i - 1]] = [elements[i - 1], elements[i]];
  }
  // A group always moves through the stack as one contiguous unit.
  const groupOrder = [...new Set(elements.map((e) => e.groupId || e.id))];
  return validateDocument({
    ...doc,
    elements: groupOrder.flatMap((key) =>
      elements.filter((e) => (e.groupId || e.id) === key),
    ),
  });
}
export function snapSelection(doc, ids, dx, dy, zoom = 1, enabled = true) {
  const targets = new Set(editableIds(doc, ids)),
    box = bounds(doc.elements.filter((e) => targets.has(e.id))),
    guides = [];
  if (!enabled || !targets.size) return { dx, dy, guides };
  const others = doc.elements
    .filter((e) => !targets.has(e.id) && !e.hidden)
    .map(elementBounds);
  const result = { dx, dy, guides };
  for (const [axis, size, delta] of [
    ["x", "width", "dx"],
    ["y", "height", "dy"],
  ]) {
    const stops = [
      0,
      doc.canvas[size] / 2,
      doc.canvas[size],
      ...others.flatMap((b) => [
        b[axis],
        b[axis] + b[size] / 2,
        b[axis] + b[size],
      ]),
    ];
    let best = 8 / Math.max(0.05, zoom),
      change = 0,
      guide;
    for (const target of stops)
      for (const offset of [0, box[size] / 2, box[size]]) {
        const d = target - (box[axis] + result[delta] + offset);
        if (Math.abs(d) < best) {
          best = Math.abs(d);
          change = d;
          guide = target;
        }
      }
    result[delta] += change;
    if (guide !== undefined) guides.push({ axis, position: guide });
  }
  return result;
}
export function shortcutAction(event) {
  if (
    event.isComposing ||
    event.altKey ||
    /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName) ||
    event.target?.isContentEditable
  )
    return null;
  const mod = event.metaKey || event.ctrlKey,
    key = event.key.toLowerCase();
  if (mod) {
    if (key === "z") return event.shiftKey ? "redo" : "undo";
    if (key === "y") return "redo";
    if (key === "s") return "save";
    if (key === "a") return "all";
    if (key === "c") return "copy";
    if (key === "x") return "cut";
    if (key === "v") return "paste";
    if (key === "d") return "duplicate";
    if (key === "g") return event.shiftKey ? "ungroup" : "group";
    return null;
  }
  if (key === "delete" || key === "backspace") return "delete";
  if (key === "escape") return "clear";
  if (["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key))
    return { move: key, distance: event.shiftKey ? 10 : 1 };
  return null;
}
