"use client";
import { useState } from "react";
import Link from "next/link";
import {
  newDesign,
  makeElement,
  validateDocument,
} from "@/lib/editor/document";
import {
  groupSelection,
  transformSelection,
  patchSelection,
  ungroupSelection,
} from "@/lib/editor/selection";
import { clipboardPayload, pasteSelection } from "@/lib/editor/clipboard";
import { sampleAsset } from "@/lib/templates/assets";
import { designStore } from "@/lib/editor/store";
import { renderExport } from "@/lib/editor/export";
import { loadImage } from "@/lib/editor/images";
async function pixels(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url),
      c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export default function QA() {
  const [status, setStatus] = useState("Ready"),
    [id, setId] = useState("");
  async function run() {
    try {
      const photo = await sampleAsset("motors");
      let d = newDesign("QA — Stage B group", 640, 480);
      d = validateDocument({
        ...d,
        assets: { photo },
        elements: [
          {
            ...makeElement("rect", "red"),
            x: 40,
            y: 40,
            width: 120,
            height: 80,
            fill: "#ff0000",
            cornerRadius: 0,
          },
          {
            ...makeElement("text", "type"),
            x: 180,
            y: 40,
            width: 220,
            height: 90,
            text: "Group QA",
            fontSize: 30,
          },
          {
            ...makeElement("image", "image"),
            x: 80,
            y: 200,
            width: 120,
            height: 120,
            assetId: "photo",
            crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          },
          {
            ...makeElement("rect", "hidden"),
            x: 0,
            y: 0,
            width: 640,
            height: 480,
            fill: "#00ff00",
          },
        ],
      });
      d = groupSelection(d, ["red", "type", "image"], "group-test");
      d = transformSelection(d, ["red"], {
        scale: 1.2,
        rotation: 25,
        origin: { x: 0, y: 0 },
        dx: 100,
        dy: 0,
      });
      d = patchSelection(
        d,
        ["hidden"],
        { hidden: true },
        { includeProtected: true },
      );
      const key = crypto.randomUUID();
      await designStore.save(key, d, 0);
      const reopened = (await designStore.loadConnected(key)).document;
      if (JSON.stringify(d) !== JSON.stringify(reopened))
        throw new Error("Grouped reopen mismatch");
      setId(key);
      const ungrouped = ungroupSelection(d, ["red"]);
      let checks = 0;
      for (const format of ["png", "jpeg"]) {
        const actual = await pixels(await renderExport(d, format, 0.92)),
          flat = await pixels(await renderExport(ungrouped, format, 0.92));
        if (actual.some((v, i) => v !== flat[i]))
          throw new Error(
            `Group export differs in ${format}: ${actual.reduce((sum, v, i) => sum + (v !== flat[i] ? 1 : 0), 0)} channels; first=${actual.findIndex((v, i) => v !== flat[i])}, maxDiff=${actual.reduce((max, v, i) => Math.max(max, Math.abs(v - flat[i])), 0)}; lengths=${actual.length}/${flat.length}; sample=${[...actual.slice((300 * 640 + 120) * 4, (300 * 640 + 120) * 4 + 4)]}/${[...flat.slice((300 * 640 + 120) * 4, (300 * 640 + 120) * 4 + 4)]}, geometry=${JSON.stringify(d.elements.map(({ groupId: _g, ...e }) => e)) === JSON.stringify(ungrouped.elements)}`,
          );
        const visibleOnly = {
          ...d,
          elements: d.elements.filter((e) => !e.hidden),
        };
        const withoutHidden = await pixels(
          await renderExport(visibleOnly, format, 0.92),
        );
        if (actual.some((v, i) => v !== withoutHidden[i]))
          throw new Error("Hidden layer leaked to export");
        const moved = actual[(90 * 640 + 150) * 4];
        if (moved < 200)
          throw new Error("Transformed red shape not at expected location");
        checks++;
      }
      const copy = clipboardPayload(d, ["red"]),
        pasted = pasteSelection(newDesign("Clipboard", 640, 480), copy, () =>
          crypto.randomUUID(),
        );
      if (
        pasted.document.elements.length !== 3 ||
        !Object.keys(pasted.document.assets).length
      )
        throw new Error("Clipboard lost photo");
      setStatus(
        `PASS: grouped text, shape and cropped photo saved/reopened; ${checks} PNG/JPG formats pixel-match ungrouped artwork and exclude hidden layers; transformed red pixels correct; clipboard preserves photo assets.`,
      );
    } catch (e) {
      setStatus("FAIL: " + e.message);
    }
  }
  return (
    <main style={{ padding: 30 }}>
      <h1>Stage B export and persistence QA</h1>
      <button onClick={run}>Run Stage B acceptance</button>
      <p role="status">{status}</p>
      {id && <Link href={`/editor/${id}`}>Open grouped QA design</Link>}
    </main>
  );
}
