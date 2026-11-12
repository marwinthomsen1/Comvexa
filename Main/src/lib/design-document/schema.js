// Application-owned contract. Renderer/editor implementation belongs to Phase 3.
export const DOCUMENT_VERSION = 1;
export function createBlankDocument(width, height) {
  if (
    ![width, height].every(
      (value) => Number.isInteger(value) && value >= 64 && value <= 4096,
    )
  )
    throw new Error("Canvas dimensions must be 64–4096 pixels.");
  return {
    schemaVersion: DOCUMENT_VERSION,
    canvas: { width, height, background: "#ffffff" },
    elements: [],
    bindings: [],
  };
}
