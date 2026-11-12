import { readImage, verifyAssets } from "../editor/images.js";
import { getFamily } from "./catalog.js";
const cache = new Map();
export async function sampleAsset(familyId) {
  const family = getFamily(familyId);
  const path =
    family.image === "headphones"
      ? "/images/wireless-headphones.png"
      : `/images/previews/${family.image}.webp`;
  if (!cache.has(path))
    cache.set(
      path,
      (async () => {
        const response = await fetch(path);
        if (!response.ok)
          throw new Error(
            "Example image could not be loaded. Upload your own photo or retry.",
          );
        const blob = await response.blob();
        return readImage(new File([blob], family.image, { type: blob.type }));
      })().catch((e) => {
        cache.delete(path);
        throw e;
      }),
    );
  return cache.get(path);
}
export async function verifyGenerated(designs) {
  for (const d of designs) await verifyAssets(d.document);
}
