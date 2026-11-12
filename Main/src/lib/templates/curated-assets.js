import { PHOTO_PATHS } from "./curated-generate.js";
import { getCuratedTemplate } from "./curated-catalog.js";
import { readImage } from "../editor/images.js";
const cache = new Map();
export async function curatedAssets(id) {
  const photos = [
      ...new Set(
        getCuratedTemplate(id)
          .commands.filter((c) => c[0] === "p")
          .map((c) => c[1]),
      ),
    ],
    result = {};
  for (const key of photos) {
    if (!cache.has(key))
      cache.set(
        key,
        (async () => {
          const response = await fetch(PHOTO_PATHS[key]);
          if (!response.ok)
            throw new Error(
              "Original template photo could not load. Please retry.",
            );
          const blob = await response.blob();
          return readImage(new File([blob], key, { type: blob.type }));
        })().catch((e) => {
          cache.delete(key);
          throw e;
        }),
      );
    result[key] = await cache.get(key);
  }
  return result;
}
