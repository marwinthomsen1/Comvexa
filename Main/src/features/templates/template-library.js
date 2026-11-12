"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  filterTemplates,
  TEMPLATE_FAMILIES,
  RATIOS,
  getFamily,
} from "@/lib/templates/catalog";
import { sampleAsset } from "@/lib/templates/assets";
import { generateDesign } from "@/lib/templates/generate";
import { browserMeasure } from "@/lib/templates/fitting";
import { DocumentPreview } from "./document-preview";
import "./templates.css";
function TemplateArtwork({ template, large = false }) {
  const root = useRef(null);
  const [doc, setDoc] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      started = false;
    async function load() {
      if (started) return;
      started = true;
      try {
        await document.fonts.ready;
        const f = getFamily(template.familyId);
        const asset = await sampleAsset(f.id);
        const result = generateDesign({
          templateId: template.id,
          campaignId: "preview",
          asset,
          assetId: "example-photo",
          fields: {
            ...f.sample,
            styleId: f.id,
            background: f.background,
            ink: f.ink,
            accent: f.accent,
          },
          measure: browserMeasure,
        });
        if (active) setDoc(result.document);
      } catch (e) {
        if (active) setError(e.message);
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (large) load();
    else observer.observe(root.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [template.id, template.familyId, large]);
  return (
    <div
      ref={root}
      className={`template-artwork ${large ? "large" : ""}`}
      style={{
        aspectRatio: `${RATIOS[template.ratio].width}/${RATIOS[template.ratio].height}`,
      }}
    >
      {doc ? (
        <DocumentPreview
          document={doc}
          label={`${template.category}: ${template.name}, ${template.ratio}`}
        />
      ) : (
        <span role="status">{error || "Preparing design…"}</span>
      )}
    </div>
  );
}
export default function TemplateLibrary() {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [ratio, setRatio] = useState("All"),
    [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const items = filterTemplates({ query, category, ratio });
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  return (
    <section className="templates-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">A BEAUTIFUL PLACE TO START</span>
          <h1>Find your next idea.</h1>
          <p>
            32 editable compositions. Eight distinct creative worlds. Make one
            your own.
          </p>
        </div>
        <Link className="button" href="/editor/new">
          Start from blank +
        </Link>
      </div>
      <div className="template-discovery">
        <label>
          Search templates
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try food, island or invitation"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All</option>
            {TEMPLATE_FAMILIES.map((f) => (
              <option key={f.id}>{f.category}</option>
            ))}
          </select>
        </label>
        <label>
          Aspect ratio
          <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option>All</option>
            {Object.keys(RATIOS).map((r) => (
              <option key={r} value={r}>
                {r[0].toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="template-count" role="status">
        {items.length} templates · Artwork and images are original examples.
        Every element stays editable.
      </p>
      <div className="template-discovery-grid">
        {items.map((t) => (
          <article key={t.id} className="discovery-card">
            <button
              className="artwork-button"
              onClick={() => setSelected(t)}
              aria-label={`Preview ${t.name}, ${t.ratio}`}
            >
              <TemplateArtwork template={t} />
            </button>
            <div>
              <span>
                {t.category} · {t.ratio}
              </span>
              <h2>{t.name}</h2>
              <p>{t.description}</p>
              <div className="template-card-actions">
                <button onClick={() => setSelected(t)}>Preview</button>
                <Link href={`/dashboard/packages?template=${t.id}`}>
                  Customize →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <h2>No matching templates.</h2>
          <p>Try a different search or reset the filters.</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setRatio("All");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      {selected && (
        <dialog
          ref={dialog}
          className="template-preview-dialog"
          onCancel={() => setSelected(null)}
          onClick={(e) => {
            if (e.target === dialog.current) setSelected(null);
          }}
        >
          <button
            className="dialog-close"
            onClick={() => setSelected(null)}
            aria-label="Close template preview"
          >
            ×
          </button>
          <TemplateArtwork template={selected} large />
          <div>
            <span className="eyebrow">
              {selected.category} · {selected.ratio}
            </span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <p>
              Customize the information and photo, then save an editable design
              or generate all four formats.
            </p>
            <Link
              className="button"
              href={`/dashboard/packages?template=${selected.id}`}
            >
              Start from template →
            </Link>
          </div>
        </dialog>
      )}
    </section>
  );
}
