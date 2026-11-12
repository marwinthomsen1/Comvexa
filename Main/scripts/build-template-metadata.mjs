import { writeFile } from "node:fs/promises";
import { curatedTemplates, CURATED_CATEGORIES, CURATED_SIZES } from "../src/lib/templates/curated-catalog.js";
const templates = curatedTemplates.map(t => Object.fromEntries(Object.entries(t).filter(([key]) => !["commands", "palette"].includes(key))));
await writeFile("src/lib/templates/curated-metadata.json", JSON.stringify({categories:CURATED_CATEGORIES,sizes:CURATED_SIZES,templates},null,2) + "\n");
console.log(`Built lightweight metadata for ${templates.length} authored templates.`);
