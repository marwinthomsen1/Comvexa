"use client";
import { useState } from "react";
import { templates, getFamily, RATIOS } from "@/lib/templates/catalog";
import { sampleAsset } from "@/lib/templates/assets";
import { generateDesign } from "@/lib/templates/generate";
import { browserMeasure, documentWarnings } from "@/lib/templates/fitting";
import { renderExport } from "@/lib/editor/export";
import { loadImage } from "@/lib/editor/images";
export default function QA() {
  const [result, setResult] = useState("Ready"),
    [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      await document.fonts.ready;
      let exports = 0;
      for (const t of templates) {
        const f = getFamily(t.familyId),
          asset = await sampleAsset(f.id);
        const r = generateDesign({
          templateId: t.id,
          campaignId: "browser-export-qa",
          asset,
          assetId: "photo",
          fields: {
            ...f.sample,
            styleId: f.id,
            background: f.background,
            ink: f.ink,
            accent: f.accent,
          },
          measure: browserMeasure,
        });
        if (
          r.warnings.length ||
          documentWarnings(r.document, browserMeasure).length
        )
          throw new Error(t.id + ": " + r.warnings.join(";"));
        for (const format of ["png", "jpeg"]) {
          const blob = await renderExport(r.document, format, 0.92),
            url = URL.createObjectURL(blob);
          try {
            const image = await loadImage(url);
            if (
              image.width !== RATIOS[t.ratio].width ||
              image.height !== RATIOS[t.ratio].height ||
              blob.size < 2000
            )
              throw new Error(t.id + " export failed");
            exports++;
          } finally {
            URL.revokeObjectURL(url);
          }
        }
        setResult(`${t.id} passed · ${exports} exports checked`);
      }
      setResult(
        `PASS: ${templates.length} templates fit with actual browser font metrics; ${exports} PNG/JPG exports decoded at correct dimensions.`,
      );
    } catch (e) {
      setResult("FAIL: " + e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main style={{ padding: 40 }}>
      <h1>Disposable template export verification</h1>
      <button disabled={busy} onClick={run}>
        Run all template exports
      </button>
      <p role="status">{result}</p>
    </main>
  );
}
