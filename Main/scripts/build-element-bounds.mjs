import Konva from "konva";
import {writeFile} from "node:fs/promises";
import {elementLibrary} from "../src/lib/elements/catalog.js";
const bounds = {};
for (const item of elementLibrary.filter(e=>e.path)) {
  const path = new Konva.Path({data:item.path});
  bounds[item.id] = path.getSelfRect();
  path.destroy();
}
await writeFile("src/lib/elements/bounds.js", "// Bounds from the same Konva path parser used by the editor; verified in tests.\nexport const graphicBounds = " + JSON.stringify(bounds,null,2) + ";\n");
console.log(`Built exact path bounds for ${Object.keys(bounds).length} vector elements.`);
