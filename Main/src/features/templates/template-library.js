"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import metadata from "@/lib/templates/curated-metadata.json";
import { discoverTemplates } from "@/lib/templates/discovery";
import { StudioIcon } from "@/components/ui/studio-icon";
import "./templates.css";
const { templates, categories, sizes } = metadata;
const styles = [...new Set(templates.map((t) => t.style))].sort();
export default function TemplateLibrary() {
  const router = useRouter(),
    dialog = useRef(null);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [ratio, setRatio] = useState("All"),
    [style, setStyle] = useState("All"),
    [selected, setSelected] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [limit, setLimit] = useState(24);
  const items = useMemo(() => discoverTemplates({query, category, ratio, style}), [query, category, ratio, style]);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  function filter(set, value) {
    set(value);
    setLimit(24);
  }
  async function start(t) {
    if (busy) return;
    setBusy(t.id);
    setError("");
    try {
      await document.fonts.ready;
      const [
        { generateCurated },
        { curatedAssets },
        { browserMeasure },
        { designStore },
      ] = await Promise.all([
        import("@/lib/templates/curated-generate"),
        import("@/lib/templates/curated-assets"),
        import("@/lib/templates/fitting"),
        import("@/lib/editor/store"),
      ]);
      const doc = generateCurated(
          t.id,
          await curatedAssets(t.id),
          browserMeasure,
        ),
        id = crypto.randomUUID();
      await designStore.save(id, doc, 0);
      router.push(`/editor/${id}`);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }
  function reset() {
    setQuery("");
    setCategory("All");
    setRatio("All");
    setStyle("All");
    setLimit(24);
  }
  return (
    <section className="templates-page curated-library">
      <div className="curated-heading">
        <div>
          <span className="eyebrow">THE COMVEXA COLLECTION / VOLUME 01</span>
          <h1>
            Good design.
            <br />
            <em>A great beginning.</em>
          </h1>
          <p>
            100 original compositions for everyday ideas and extraordinary
            moments. Pick your starting point. Make every detail yours.
          </p>
        </div>
        <div className="curated-heading-aside">
          <span className="collection-number">100</span>
          <span>
            COMPOSITIONS
            <br />
            ENDLESS POSSIBILITIES
          </span>
          <Link className="button" href="/editor/new">
            <StudioIcon name="plus" />
            Start from blank
          </Link>
        </div>
      </div>
      <div className="curated-category-rail" aria-label="Template categories">
        <button
          aria-pressed={category === "All"}
          onClick={() => filter(setCategory, "All")}
        >
          All designs <span>100</span>
        </button>
        {categories.map(([id, name, count]) => (
          <button
            key={id}
            aria-pressed={category === id}
            onClick={() => filter(setCategory, id)}
          >
            {name}
            <span>{count}</span>
          </button>
        ))}
      </div>
      <div className="template-discovery curated-discovery">
        <label>
          <span>
            <StudioIcon name="search" size={15} /> Find your starting point
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => filter(setQuery, e.target.value)}
            placeholder="Try wedding, editorial, coffee or bold…"
          />
        </label>
        <label>
          Format
          <select
            value={ratio}
            onChange={(e) => filter(setRatio, e.target.value)}
          >
            <option value="All">All formats</option>
            {Object.entries(sizes).map(([key, size]) => (
              <option key={key} value={key}>
                {size.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visual style
          <select
            value={style}
            onChange={(e) => filter(setStyle, e.target.value)}
          >
            <option value="All">Every style</option>
            {styles.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="curated-results">
        <p role="status">
          <strong>{items.length}</strong> original {items.length === 1 ? "design" : "designs"} · Fully editable ·
          Free standard exports
        </p>
        <div>
          <button onClick={reset}>Reset filters</button>
          <a
            href="/template-review/index.html"
            target="_blank"
            rel="noreferrer"
          >
            View all 100 ↗
          </a>
        </div>
      </div>
      {error && (
        <p className="editor-error" role="alert">
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </p>
      )}
      <div className="curated-grid">
        {items.slice(0, limit).map((t, index) => (
          <article className="curated-card" key={t.id}>
            <button
              className="curated-artwork"
              aria-label={`Preview ${t.name}`}
              onClick={() => setSelected(t)}
              style={{
                aspectRatio: `${sizes[t.ratio].width}/${sizes[t.ratio].height}`,
              }}
            >
              <Image
                src={`/images/templates/${t.id}.webp`}
                alt={`${t.name}, ${t.style} editable ${sizes[t.ratio].label}`}
                width={480}
                height={Math.round(
                  (480 * sizes[t.ratio].height) / sizes[t.ratio].width,
                )}
                sizes="(max-width: 550px) 46vw, (max-width: 1100px) 30vw, 23vw"
                loading={index < 4 ? "eager" : "lazy"}
              />
              <span className="curated-card-overlay">
                <StudioIcon name="eye" size={16} />
                Preview design
              </span>
            </button>
            <div className="curated-card-copy">
              <span>
                {t.style} / {sizes[t.ratio].label}
              </span>
              <h2>{t.name}</h2>
              <button onClick={() => start(t)} disabled={!!busy}>
                {busy === t.id ? "Opening…" : "Use template"}
                <StudioIcon name="edit" size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <h2>No designs found.</h2>
          <p>Try another keyword or clear a filter.</p>
          <button className="button" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
      {limit < items.length && (
        <div className="curated-load">
          <button className="button" onClick={() => setLimit((v) => v + 24)}>
            Explore more designs <StudioIcon name="plus" size={16} />
          </button>
          <span>
            Showing {Math.min(limit, items.length)} of {items.length}
          </span>
        </div>
      )}
      {selected && (
        <dialog
          ref={dialog}
          className="template-preview-dialog curated-dialog"
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
            <StudioIcon name="close" />
          </button>
          <Image
            src={`/images/templates/${selected.id}.webp`}
            alt={selected.name}
            width={480}
            height={Math.round(
              (480 * sizes[selected.ratio].height) /
                sizes[selected.ratio].width,
            )}
            className="curated-large-preview"
          />
          <div>
            <span className="eyebrow">
              {selected.style} / {sizes[selected.ratio].label}
            </span>
            <h2>{selected.name}</h2>
            {error && <p role="alert">{error}</p>}
            <p>{selected.description}</p>
            <p>
              Text, photographs, colors, shapes and layers are individual
              editable elements. Your saved copy stays independent of future
              library updates.
            </p>
            <p className="curated-format">
              {sizes[selected.ratio].width} × {sizes[selected.ratio].height} px
              · {categories.find((c) => c[0] === selected.category)?.[1]}
            </p>
            <button
              className="button"
              disabled={!!busy}
              onClick={() => start(selected)}
            >
              <StudioIcon name="edit" />
              {busy ? "Preparing your canvas…" : "Make it yours"}
            </button>
            <p>
              Saved in this browser. Standard PNG/JPG exports have no watermark.
              No cloud backup.
            </p>
          </div>
        </dialog>
      )}
    </section>
  );
}
