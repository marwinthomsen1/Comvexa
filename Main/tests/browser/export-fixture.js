"use client";
import { useState } from "react";
import { newDesign, makeElement } from "@/lib/editor/document";
import { renderExport } from "@/lib/editor/export";
import { readImage, loadImage } from "@/lib/editor/images";
export default function QA() {
  const [result, setResult] = useState("Ready");
  async function run() {
    try {
      let d = newDesign("Export QA", 320, 240);
      d.elements = [
        {
          ...makeElement("rect", "rect-1"),
          x: 20,
          y: 30,
          width: 100,
          height: 70,
          fill: "#8955ed",
          cornerRadius: 0,
        },
        {
          ...makeElement("text", "text-1"),
          x: 150,
          y: 20,
          width: 150,
          height: 120,
          fontSize: 28,
          text: "Export QA",
        },
      ];
      d.elements.push({
        ...makeElement("ellipse", "ellipse-1"),
        x: 20,
        y: 140,
        width: 80,
        height: 50,
        fill: "#21b583",
      });
      const response = await fetch("/images/previews/travel.webp");
      const asset = await readImage(
        new File([await response.blob()], "travel.webp", {
          type: "image/webp",
        }),
      );
      d.assets.asset = asset;
      d.elements.push({
        ...makeElement("image", "image-1"),
        x: 150,
        y: 150,
        width: 100,
        height: 80,
        assetId: "asset",
        crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
      });
      const outputs = [];
      for (const format of ["png", "jpeg"]) {
        const blob = await renderExport(d, format, 0.92);
        const url = URL.createObjectURL(blob);
        try {
          const image = await loadImage(url);
          if (image.width !== 320 || image.height !== 240)
            throw new Error("Wrong dimensions");
          const c = document.createElement("canvas");
          c.width = 320;
          c.height = 240;
          const ctx = c.getContext("2d");
          ctx.drawImage(image, 0, 0);
          const p = ctx.getImageData(50, 50, 1, 1).data;
          if (Math.abs(p[0] - 137) > 5 || Math.abs(p[1] - 85) > 5)
            throw new Error("Position/color mismatch");
          const bg = ctx.getImageData(5, 5, 1, 1).data;
          if (bg[0] < 250 || bg[3] !== 255)
            throw new Error("Background mismatch");
          const ellipse = ctx.getImageData(60, 165, 1, 1).data;
          if (Math.abs(ellipse[1] - 181) > 10)
            throw new Error("Ellipse positioning mismatch");
          const text = ctx.getImageData(150, 20, 150, 100).data;
          let ink = 0;
          for (let p = 0; p < text.length; p += 4) if (text[p] < 100) ink++;
          if (ink < 100) throw new Error("Missing text");
          const img = ctx.getImageData(180, 180, 1, 1).data;
          if (img[0] === 255 && img[1] === 255)
            throw new Error("Missing image");
          outputs.push(
            `${format}: 320 × 240, background, shape/ellipse positions, text and cropped image passed (${blob.size} bytes)`,
          );
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      try {
        await readImage(
          new File(['<svg onload="bad()"></svg>'], "evil.svg", {
            type: "image/svg+xml",
          }),
        );
        throw new Error("SVG accepted");
      } catch (e) {
        if (e.message === "SVG accepted") throw e;
        outputs.push("SVG upload rejected");
      }
      setResult(outputs.join("\n"));
    } catch (e) {
      setResult("FAIL: " + e.message);
    }
  }
  return (
    <main style={{ padding: 40 }}>
      <h1>Disposable browser export test</h1>
      <button onClick={run}>Run export assertions</button>
      <pre>{result}</pre>
    </main>
  );
}
