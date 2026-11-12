export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export function inspectImage(bytes, mime) {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.length < 24 ||
    bytes.length > MAX_IMAGE_BYTES
  )
    throw new Error("Image must be valid and at most 8 MB.");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width, height, type;
  if (bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") {
    type = "image/png";
    for (let offset = 8; offset + 8 < bytes.length;) {
      const length = dv.getUint32(offset);
      const chunk = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      if (chunk === "acTL") throw new Error("Animated PNG is not supported.");
      if (length > bytes.length - offset - 12) break;
      offset += 12 + length;
    }

    width = dv.getUint32(16);
    height = dv.getUint32(20);
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    type = "image/jpeg";
    let i = 2;
    while (i + 8 < bytes.length) {
      if (bytes[i] !== 255) {
        i++;
        continue;
      }
      const marker = bytes[i + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const len = dv.getUint16(i + 2);
      if (len < 2) break;
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        height = dv.getUint16(i + 5);
        width = dv.getUint16(i + 7);
        break;
      }
      i += 2 + len;
    }
  } else if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    type = "image/webp";
    if (bytes[20] & 2 && String.fromCharCode(...bytes.slice(12, 16)) === "VP8X")
      throw new Error("Animated WebP is not supported.");
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X" && bytes.length >= 30) {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (chunk === "VP8 " && bytes.length >= 30) {
      width = dv.getUint16(26, true) & 16383;
      height = dv.getUint16(28, true) & 16383;
    } else if (chunk === "VP8L" && bytes.length >= 25) {
      const b = dv.getUint32(21, true);
      width = (b & 16383) + 1;
      height = ((b >> 14) & 16383) + 1;
    }
  }
  if (type !== mime || !width || !height || width > 4096 || height > 4096)
    throw new Error(
      "Use a PNG, JPG or WebP image up to 4096 × 4096 pixels. SVG, HTML and animated formats are unsupported.",
    );
  return { width, height, type };
}
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        resolve(image);
      } catch {
        reject(new Error("Image is corrupted or could not be decoded."));
      }
    };
    image.onerror = () =>
      reject(new Error("Image is corrupted or could not be decoded."));
    image.src = src;
  });
}
// Normalize decoded pixels before transforms, avoiding browser first-use image
// resampling differences between an image element and its cached texture.
export async function loadRenderImage(src) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d").drawImage(image, 0, 0);
  return canvas;
}
export async function readImage(file) {
  if (!file || file.size > MAX_IMAGE_BYTES)
    throw new Error("Choose an image up to 8 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  inspectImage(bytes, file.type);
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (img.naturalWidth > 4096 || img.naturalHeight > 4096)
      throw new Error("Image dimensions exceed limits.");
    const scale = Math.min(
      1,
      2048 / img.naturalWidth,
      2048 / img.naturalHeight,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      src: canvas.toDataURL("image/webp", 0.9),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function verifyAssets(doc) {
  for (const asset of Object.values(doc.assets)) {
    const [prefix, b64] = asset.src.split(",");
    const mime = prefix.slice(5).split(";")[0];
    const raw = atob(b64);
    inspectImage(
      Uint8Array.from(raw, (c) => c.charCodeAt(0)),
      mime,
    );
    const image = await loadImage(asset.src);
    if (
      image.naturalWidth !== asset.width ||
      image.naturalHeight !== asset.height
    )
      throw new Error("Image metadata does not match its contents.");
  }
}
