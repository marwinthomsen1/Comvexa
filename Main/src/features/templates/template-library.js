"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {useAssetPreferences} from '@/features/editor/workspace/preferences';
import {AssetFavorite,AssetViewFilter} from '@/features/editor/workspace/asset-controls';
import {filterAssetItems} from '@/lib/workspace-ui/preferences';
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import metadata, {templateThumbnail} from "@/lib/templates/library-metadata";
import {createTemplateDocument, rememberTemplate} from "@/lib/templates/open-template";
import { discoverTemplates } from "@/lib/templates/discovery";
import dynamic from "next/dynamic";
const VideoTemplatePreview=dynamic(()=>import("@/features/video/template-preview"),{ssr:false,loading:()=> <p role="status">Preparing video preview…</p>});
import { StudioIcon } from "@/components/ui/studio-icon";
import {multiPageTemplates,generateMultiPageTemplate} from "@/lib/templates/multipage";
import "./templates.css";
const { templates, categories, sizes } = metadata;
const styles = [...new Set(templates.map((t) => t.style))].sort();
export default function TemplateLibrary() {
  const assetPrefs=useAssetPreferences(),[assetView,setAssetView]=useState('all');
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
  const items = useMemo(() => filterAssetItems(discoverTemplates({query, category, ratio, style}),'template',assetView,assetPrefs), [query, category, ratio, style,assetView,assetPrefs]);
  useEffect(() => {
    function sync(){const params=new URLSearchParams(window.location.search);setCategory(params.get('category')?.split(',').every(id=>categories.some(c=>c[0]===id))?params.get('category'):'All');setQuery(params.get('q')||'');setRatio(Object.hasOwn(sizes,params.get('ratio'))?params.get('ratio'):'All');setStyle(styles.includes(params.get('style'))?params.get('style'):'All');setLimit(24);}
    sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);
  }, []);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  function filter(set, value) {
    set(value);
    const key=set===setCategory?'category':set===setQuery?'q':set===setRatio?'ratio':'style';
    const url=new URL(window.location.href);
    value==='All'||!value.trim()?url.searchParams.delete(key):url.searchParams.set(key,value);
    window.history.replaceState(null,'',url);
    setLimit(24);
  }
  async function start(t) {
    if (busy) return;
    setBusy(t.id);
    setError("");
    try {
      const {designStore}=await import("@/lib/editor/store");
      const doc=await createTemplateDocument(t.id), id=crypto.randomUUID();
      await designStore.save(id, doc, 0);
      rememberTemplate(t.id);
      router.push(`/editor/${id}`);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  }
  function reset() {
    setAssetView("all");
    setQuery("");
    setCategory("All");
    setRatio("All");
    setStyle("All");
    setLimit(24);
    window.history.replaceState(null,"",window.location.pathname);
  }
  return (
    <section className="templates-page curated-library">
      <div className="curated-heading">
        <div>
          <span className="eyebrow">THE COMVEXA COLLECTION</span>
          <h1>
            Your next idea.
            <br />
            <em>A great beginning.</em>
          </h1>
          <p>
            {templates.length} original compositions for everyday ideas and extraordinary
            moments. Pick your starting point. Make every detail yours.
          </p>
        </div>
        <div className="curated-heading-aside">
          <span className="collection-number">{templates.length}</span>
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
      <details className="multipage-template-section"><summary>Multi-page collections · 9 editable sets</summary><div className="multipage-template-grid">{multiPageTemplates.map(t=><button key={t.id} disabled={!!busy} onClick={async()=>{if(busy)return;setBusy(t.id);setError("");try{const doc=await generateMultiPageTemplate(t.id),{designStore}=await import("@/lib/editor/store"),id=crypto.randomUUID();await designStore.save(id,doc,0);router.push(`/editor/${id}`);}catch(e){setError(e.message);setBusy("");}}}><Image src={`/images/templates/${t.cover}.webp`} width={160} height={180} alt=""/><strong>{busy===t.id?"Opening…":t.name}</strong><span>3 editable pages</span></button>)}</div></details>
      <AssetViewFilter value={assetView} onChange={value=>{setAssetView(value);setLimit(24);}}/>
      <div className="curated-category-rail" aria-label="Template categories">
        <button
          aria-pressed={category === "All"}
          onClick={() => filter(setCategory, "All")}
        >
          All designs <span>{templates.length}</span>
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
            placeholder="Try resume, pitch deck, wedding or editorial…"
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
            Original collection ↗
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
          <article className="curated-card asset-entry" key={t.id}><AssetFavorite kind="template" id={t.id} name={t.name} prefs={assetPrefs}/>
            <button
              className="curated-artwork"
              aria-label={`Preview ${t.name}`}
              onClick={() => setSelected(t)}
              disabled={!!busy}
              style={{
                aspectRatio: `${sizes[t.ratio].width}/${sizes[t.ratio].height}`,
              }}
            >
              <Image
                src={templateThumbnail(t)}
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
                Preview template
              </span>
            </button>
            <div className="curated-card-copy">
              <span>
                {t.video?'Video · ':''}{t.style} / {sizes[t.ratio].label}
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
          aria-labelledby="template-preview-title"
          onClose={() => setSelected(null)}
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
          {selected.video?<VideoTemplatePreview id={selected.id}/>:<>          <Image
            src={templateThumbnail(selected)}
            alt={selected.name}
            width={480}
            height={Math.round(
              (480 * sizes[selected.ratio].height) /
                sizes[selected.ratio].width,
            )}
            className="curated-large-preview"
          />
</>}
          <div>
            {selected.pageCount>1&&<div className="deck-preview-strip">{Array.from({length:selected.pageCount},(_,i)=><Image key={i} src={`/images/templates/${selected.id}${i?`-page-${i+1}`:''}.svg`} alt={`Page ${i+1}`} width={240} height={135} loading="lazy"/>)}</div>}
            <span className="eyebrow">
              {selected.style} / {sizes[selected.ratio].label}
            </span>
            <h2 id="template-preview-title">{selected.name}</h2>
            <p>{selected.pageCount || 1} editable {(selected.pageCount || 1)===1?'page':'pages'}</p>
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
              No cloud backup. PDF exports use images; text is not selectable. Video exports are available in browser-supported formats. PPTX export is not supported.
            </p>
          </div>
        </dialog>
      )}
    </section>
  );
}
