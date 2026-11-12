"use client";
import { useState } from "react";
import {
  curatedTemplates,
  CURATED_CATEGORIES,
} from "@/lib/templates/curated-catalog";
import {
  PHOTO_PATHS,
  generateCurated,
  validateCuratedQuality,
  geometrySignature,
} from "@/lib/templates/curated-generate";
import { readImage, verifyAssets } from "@/lib/editor/images";
import { browserMeasure } from "@/lib/templates/fitting";
import { renderExport } from "@/lib/editor/export";
import { designStore } from "@/lib/editor/store";
import {
  patchElement,
  history,
  commit,
  undo,
  redo,
} from "@/lib/editor/document";
async function base64(blob) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.readAsDataURL(blob);
  });
}
import { templates, getFamily } from "@/lib/templates/catalog";
import { generateDesign } from "@/lib/templates/generate";
import { sampleAsset } from "@/lib/templates/assets";
export default function QA() {
  const [status, setStatus] = useState("Ready"),
    [results, setResults] = useState([]),
    [busy, setBusy] = useState(false);
  async function run(legacy = false) {
    const started = performance.now();
    setBusy(true);
    const rows = [],
      signatures = new Set();
    try {
      await document.fonts.ready;
      const assets = {};
      for (const [key, path] of Object.entries(PHOTO_PATHS)) {
        const blob = await (await fetch(path)).blob();
        assets[key] = await readImage(
          new File([blob], key, { type: blob.type }),
        );
      }
      for (const t of legacy ? templates : curatedTemplates) {
        setStatus(`Verifying ${rows.length + 1}/100: ${t.name}`);
        try {
          const family = legacy ? getFamily(t.familyId) : null;
          const doc = legacy ? generateDesign({templateId:t.id, campaignId:"legacy-audit", fields:{...family.sample, styleId:family.id, background:family.background, ink:family.ink, accent:family.accent}, asset:await sampleAsset(t.familyId), assetId:"legacy-photo", measure:browserMeasure}).document : generateCurated(t.id, assets, browserMeasure),
            issues = legacy ? [] : validateCuratedQuality(doc, browserMeasure);
          if (issues.length) throw new Error(issues.join("; "));
          await verifyAssets(doc);
          const signature = geometrySignature(doc);
          if (signatures.has(signature)) throw new Error("Duplicate geometry");
          signatures.add(signature);
          if (legacy) {
            const blob = await renderExport(doc, "png");
            const response = await fetch("/api/template-library-qa", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:t.id,format:"png",data:await base64(blob)})});
            if (!response.ok) throw new Error("Legacy render sink failed");
            rows.push({id:t.id,result:"PASS",elements:doc.elements.length});
            setResults([...rows]);
            continue;
          }
          const key = crypto.randomUUID();
          await designStore.save(key, doc, 0);
          const reopened = legacy ? await designStore.load(key) : await designStore.loadConnected(key);
          if (JSON.stringify(reopened.document) !== JSON.stringify(doc))
            throw new Error("Reopen differs");
          const text = doc.elements.find((e) => e.type === "text");
          const changed = patchElement(doc, text.id, {
            text: "Edited template",
          });
          const state = commit(history(doc), changed);
          if (
            undo(state).present.elements.find((e) => e.id === text.id).text !==
              text.text ||
            redo(undo(state)).present.elements.find((e) => e.id === text.id)
              .text !== "Edited template"
          )
            throw new Error("Edit/undo/redo failed");
          for (const format of legacy ? ["png"] : ["png", "jpeg"]) {
            const blob = await renderExport(doc, format, 0.92);
            if (!blob.size) throw new Error("Empty export");
            const response = await fetch("/api/template-library-qa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: t.id,
                format,
                data: await base64(blob),
              }),
            });
            if (!response.ok) throw new Error("Export QA sink failed");
            const size = await response.json();
            if (
              size.width !== doc.canvas.width ||
              size.height !== doc.canvas.height
            )
              throw new Error("Dimensions differ");
          }
          rows.push({
            id: t.id,
            result: "PASS",
            elements: doc.elements.length,
            editor: `/editor/${key}`,
          });
        } catch (e) {
          rows.push({ id: t.id, result: "FAIL", error: e.message });
        }
        setResults([...rows]);
      }
      await fetch("/api/template-library-qa", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({report:{legacy,rows,durationMs:performance.now()-started, browser:navigator.userAgent}})});
      setStatus(legacy ? `${rows.filter(r=>r.result === "PASS").length}/32 original layouts rendered for visual audit.` :
        `${rows.filter((r) => r.result === "PASS").length}/100 PASS: render, validation, edit/undo/redo, save/reopen, PNG and JPG exports. ${signatures.size} distinct geometries.`,
      );
    } catch (e) {
      setStatus("FAIL: " + e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main style={{ padding: 30 }}>
      <h1>100-template acceptance verification</h1>
      <p>
        Original assets, real browser fonts, saved documents and both export
        formats.
      </p>
      <button disabled={busy} onClick={() => run()}>
        Verify all 100 templates
      </button>
      <button disabled={busy} onClick={() => run(true)}>Audit original 32</button>
      <p role="status">{status}</p>
      <pre>{JSON.stringify(results, null, 2)}</pre>
      <p>
        {CURATED_CATEGORIES.map(
          (c) =>
            `${c[1]}: ${curatedTemplates.filter((t) => t.category === c[0]).length}`,
        ).join(" · ")}
      </p>
    </main>
  );
}
