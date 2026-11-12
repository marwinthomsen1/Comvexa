import { scaleTextStyle } from "../typography/style.js";
// Transient interaction helpers. Never serialized into application documents.
export const ROTATION_STOPS = Array.from({ length: 24 }, (_, i) => i * 15);
export const ROTATION_TOLERANCE = 3;
export const normalizeAngle = (value) => ((value % 360) + 360) % 360;
export function angleDelta(next, previous) {
  return ((next - previous + 540) % 360) - 180;
}
export function rotationPolicy(enabled, shift = false) {
  return {
    stops: enabled !== shift ? ROTATION_STOPS : [],
    tolerance: ROTATION_TOLERANCE,
  };
}
export function snapRotation(angle, enabled = true, shift = false) {
  if (enabled === shift) return normalizeAngle(angle);
  const normalized = normalizeAngle(angle),
    nearest = normalizeAngle(Math.round(normalized / 15) * 15);
  return Math.abs(angleDelta(normalized, nearest)) <= ROTATION_TOLERANCE
    ? nearest
    : normalized;
}
export function formatAngle(angle) {
  const n = angleDelta(normalizeAngle(angle), 0);
  return `${Math.abs(n) < 0.05 ? 0 : Math.round(n * 10) / 10}°`;
}
export function selectionFrame(previous, items, signature) {
  const first = items[0]?.rotation || 0;
  if (previous?.signature === signature)
    return {
      signature,
      first,
      rotation: previous.rotation + angleDelta(first, previous.first),
    };
  return {
    signature,
    first,
    rotation:
      items.length &&
      items.every((e) => Math.abs(angleDelta(e.rotation, first)) < 0.001)
        ? first
        : 0,
  };
}
export function transformAppearance(touch = false) {
  return {
    anchor: touch ? 12 : 8,
    hit: touch ? 24 : 14,
    rotation: touch ? 30 : 24,
    offset: touch ? 54 : 40,
    padding: 2,
    border: 1.25,
  };
}
export function createFrameChannel(draw, request, cancel) {
  let ticket = null,
    pending;
  const flush = () => {
    if (ticket !== null) cancel(ticket);
    ticket = null;
    if (pending !== undefined) {
      const value = pending;
      pending = undefined;
      draw(value);
    }
  };
  return {
    push(value) {
      pending = value;
      if (ticket === null)
        ticket = request(() => {
          ticket = null;
          flush();
        });
    },
    flush,
    cancel() {
      if (ticket !== null) cancel(ticket);
      ticket = null;
      pending = undefined;
    },
  };
}
const round = (n) => Math.round(n * 1e6) / 1e6;
export function finalTransformPatches(items, samples) {
  return items.flatMap((e) => {
    const n = samples.find((n) => n.id === e.id);
    if (!n) return [];
    const patch = {
      x: round(n.x),
      y: round(n.y),
      width: round(e.width * n.scaleX),
      height: round(e.height * n.scaleY),
      rotation: round(normalizeAngle(n.rotation)),
    };
    if (e.type === "text") {
      patch.fontSize = round(e.fontSize * n.scaleX);
      Object.assign(patch, scaleTextStyle(e.textStyle, n.scaleX));
    }
    if (items.length > 1 && (e.type === "rect" || e.type === "ellipse")) {
      patch.strokeWidth = round(e.strokeWidth * n.scaleX);
      patch.cornerRadius = round(e.cornerRadius * n.scaleX);
    }
    return Object.entries(patch).some(
      ([key, value]) =>
        Math.abs(
          key === "rotation" ? angleDelta(value, e[key]) : value - e[key],
        ) > 1e-6,
    )
      ? [{ id: e.id, patch }]
      : [];
  });
}
