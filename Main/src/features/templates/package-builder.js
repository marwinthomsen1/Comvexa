"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TEMPLATE_FAMILIES,
  RATIOS,
  getFamily,
  getTemplate,
} from "@/lib/templates/catalog";
import {
  generateDesign,
  generatePackage,
  validateCampaign,
} from "@/lib/templates/generate";
import { browserMeasure } from "@/lib/templates/fitting";
import { sampleAsset, verifyGenerated } from "@/lib/templates/assets";
import { readImage } from "@/lib/editor/images";
import { designStore } from "@/lib/editor/store";
import { DocumentPreview } from "./document-preview";
import "./templates.css";
const limits = {
  name: 160,
  description: 600,
  price: 80,
  contact: 120,
  link: 160,
};
export default function PackageBuilder() {
  const initial = TEMPLATE_FAMILIES[0];
  const [fields, setFields] = useState({
      ...initial.sample,
      styleId: initial.id,
      background: initial.background,
      ink: initial.ink,
      accent: initial.accent,
    }),
    [step, setStep] = useState(1),
    [asset, setAsset] = useState(null),
    [assetLabel, setAssetLabel] = useState("Original example photo"),
    [assetId, setAssetId] = useState(""),
    [photos, setPhotos] = useState([]),
    [mode, setMode] = useState("package"),
    [ratio, setRatio] = useState("square"),
    [bundle, setBundle] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [saveStatus, setSaveStatus] = useState(""),
    [photoBusy, setPhotoBusy] = useState(false);
  const upload = useRef(null),
    request = useRef(0),
    ownedPhoto = useRef(false),
    pending = useRef(false);
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("template");
      if (id) {
        const t = getTemplate(id),
          f = getFamily(t.familyId);
        setFields({
          ...f.sample,
          styleId: f.id,
          background: f.background,
          ink: f.ink,
          accent: f.accent,
        });
        setRatio(t.ratio);
        setMode("single");
      }
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    let active = true;
    const token = ++request.current;
    if (ownedPhoto.current) return;
    setPhotoBusy(true);
    sampleAsset(fields.styleId)
      .then((a) => {
        if (active && request.current === token) {
          setAsset(a);
          setAssetId(crypto.randomUUID());
          setAssetLabel("Original example photo");
        }
      })
      .catch((e) => {
        if (active) {
          setAsset(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (active && request.current === token) setPhotoBusy(false);
      });
    return () => {
      active = false;
    };
  }, [fields.styleId]);
  useEffect(() => {
    pending.current = !!bundle && !saved;
  }, [bundle, saved]);
  useEffect(() => {
    const leave = (e) => {
      if (pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  function field(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }
  function chooseStyle(id) {
    const f = getFamily(id);
    setFields((current) => ({
      ...current,
      styleId: id,
      background: f.background,
      ink: f.ink,
      accent: f.accent,
    }));
    setError("");
  }
  async function photo(files) {
    const token = ++request.current;
    setPhotoBusy(true);
    setError("");
    try {
      if (files.length > 4)
        throw new Error("Choose up to four photos per package.");
      const images = [];
      for (const file of files) {
        const image = await readImage(file);
        images.push({ id: crypto.randomUUID(), asset: image, name: file.name });
      }
      if (request.current !== token) return;
      ownedPhoto.current = true;
      setPhotos(images);
      setAsset(images[0].asset);
      setAssetId(images[0].id);
      setAssetLabel(images.map((p) => p.name).join(", "));
    } catch (e) {
      setError(e.message);
    } finally {
      if (request.current === token) setPhotoBusy(false);
    }
  }
  async function generate() {
    setError("");
    setBusy(true);
    setSaveStatus("");
    try {
      const checked = validateCampaign(fields);
      if (!asset)
        throw new Error(
          "Upload a photo or wait for the example image to load.",
        );
      await document.fonts.ready;
      const campaignId = crypto.randomUUID();
      let result;
      if (mode === "package")
        result = generatePackage({
          campaignId,
          fields: checked,
          asset,
          assetId,
          measure: browserMeasure,
          photos,
        });
      else {
        const design = {
          id: crypto.randomUUID(),
          ...generateDesign({
            templateId: `${fields.styleId}-${ratio}`,
            campaignId,
            fields: checked,
            asset,
            assetId,
            measure: browserMeasure,
          }),
        };
        result = {
          campaign: {
            id: campaignId,
            name: checked.name,
            fields: checked,
            assetId,
            styleId: checked.styleId,
            designIds: [design.id],
            createdAt: new Date().toISOString(),
          },
          designs: [design],
          warnings: design.warnings,
        };
      }
      await verifyGenerated(result.designs);
      setBundle(result);
      setSaved(false);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!bundle || saved) return;
    setBusy(true);
    setError("");
    setSaveStatus("Saving the campaign and all designs…");
    try {
      await designStore.savePackage(bundle);
      setSaved(true);
      setSaveStatus("Saved in this browser. Your designs are ready to edit.");
    } catch (e) {
      setSaveStatus(
        "Save failed. Nothing from this package was committed. Your preview is still here; retry or download it.",
      );
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function backup() {
    import("@/lib/editor/export").then(({ download }) => {
      for (const d of bundle.designs)
        download(
          new Blob([JSON.stringify(d.document)], { type: "application/json" }),
          `${d.document.name}.comvexa.json`,
        );
    });
  }
  return (
    <section className="package-builder">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">CREATE ONCE. USE EVERYWHERE.</span>
          <h1>Your idea. A whole design package.</h1>
          <p>
            One brief becomes four coordinated, editable designs. No AI
            subscription or cloud account needed.
          </p>
        </div>
        <Link className="text-link" href="/dashboard/templates">
          Browse templates ↗
        </Link>
      </div>
      <ol className="package-steps">
        {["Your information", "Creative direction", "Review & save"].map(
          (label, i) => (
            <li key={label} aria-current={step === i + 1 ? "step" : undefined}>
              <span>{i + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {step === 1 && (
        <div className="package-form-layout">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                validateCampaign(fields);
                setError("");
                setStep(2);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <h2>Tell your story.</h2>
            <p>
              Start with the essentials. Optional fields are omitted when empty.
            </p>
            {Object.entries({
              name: "Product or event name",
              description: "Description",
              price: "Price or offer (optional)",
              contact: "Contact or event details (optional)",
              link: "Website or social link (optional)",
            }).map(([key, label]) => (
              <label className="package-field" key={key}>
                {label}
                {key === "description" ? (
                  <textarea
                    value={fields[key]}
                    maxLength={limits[key]}
                    rows={4}
                    onChange={(e) => field(key, e.target.value)}
                  />
                ) : (
                  <input
                    required={key === "name"}
                    value={fields[key]}
                    maxLength={limits[key]}
                    onChange={(e) => field(key, e.target.value)}
                  />
                )}
                <small>
                  {fields[key].length}/{limits[key]}
                </small>
              </label>
            ))}
            <button className="button" type="submit">
              Choose a direction →
            </button>
          </form>
          <aside>
            <span className="eyebrow">THE SAME STORY. A DIFFERENT CANVAS.</span>
            <h2>
              A post. A story.
              <br />A campaign that belongs together.
            </h2>
            <p>
              Every text block, photo and shape stays editable. Shared
              references are prepared now; shared campaign information can be
              updated from Campaigns.
            </p>
            <p className="local-note">
              Saved only in this browser. Download editable project files for
              backup.
            </p>
          </aside>
        </div>
      )}
      {step === 2 && (
        <>
          <div className="package-direction-grid">
            <section>
              <h2>Choose your creative world.</h2>
              <div className="style-options">
                {TEMPLATE_FAMILIES.map((f) => (
                  <button
                    key={f.id}
                    aria-pressed={fields.styleId === f.id}
                    onClick={() => chooseStyle(f.id)}
                  >
                    <span
                      className="style-color"
                      style={{ background: f.background, color: f.ink }}
                    >
                      {f.name.slice(0, 1)}
                    </span>
                    <strong>{f.name}</strong>
                    <small>{f.category}</small>
                  </button>
                ))}
              </div>
              <h3>Make the palette yours.</h3>
              <div className="palette-fields">
                {["background", "ink", "accent"].map((key) => (
                  <label key={key}>
                    {key === "ink" ? "Text" : key}
                    <input
                      type="color"
                      value={fields[key]}
                      onChange={(e) => field(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              <label className="package-field">
                Create
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="package">
                    Full package · all four formats
                  </option>
                  <option value="single">One editable design</option>
                </select>
              </label>
              {mode === "single" && (
                <label className="package-field">
                  Aspect ratio
                  <select
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value)}
                  >
                    {Object.entries(RATIOS).map(([r, s]) => (
                      <option key={r} value={r}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>
            <section className="package-photo">
              <h2>Your photograph.</h2>
              {asset && (
                <Image
                  src={asset.src}
                  width={asset.width}
                  height={asset.height}
                  unoptimized
                  alt="Selected campaign photograph"
                />
              )}
              <p>{assetLabel}</p>
              <button
                className="button button-outline"
                disabled={photoBusy}
                onClick={() => upload.current.click()}
              >
                {photoBusy ? "Preparing photo…" : "Upload your own photo"}
              </button>
              <p>
                PNG, JPG or WebP · up to 8 MB and 4096 × 4096. Images are
                optimized locally and stored with the designs. Nothing is
                uploaded to a server.
              </p>
              <p>
                Center cropping adapts your photo to each composition. You can
                adjust it in the editor.
              </p>
            </section>
          </div>
          <div className="package-actions">
            <button
              className="button button-outline"
              onClick={() => setStep(1)}
            >
              ← Information
            </button>
            <button
              className="button"
              disabled={busy || photoBusy || !asset}
              onClick={generate}
            >
              {busy
                ? "Building your designs…"
                : mode === "package"
                  ? "Generate four designs ✦"
                  : "Preview editable design ✦"}
            </button>
          </div>
        </>
      )}
      {step === 3 && bundle && (
        <>
          <div className="package-review-heading">
            <div>
              <h2>
                {saved
                  ? "Your creative set is ready."
                  : "A little magic. All yours."}
              </h2>
              <p>
                Review every format before saving. Text and photo placement are
                editable.
              </p>
            </div>
            <p className="local-note" role="status">
              {saveStatus || "Preview only — not saved yet."}
            </p>
          </div>
          {bundle.warnings.length > 0 && (
            <div className="package-warnings" role="alert">
              <h3>Please adjust your content.</h3>
              <ul>
                {bundle.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <p>
                Saving is disabled until every field fits. Go back and shorten
                the content, or choose another style.
              </p>
            </div>
          )}
          <div className="generated-design-grid">
            {bundle.designs.map((d) => (
              <article key={d.id}>
                <DocumentPreview
                  document={d.document}
                  label={`${RATIOS[d.ratio].label} generated preview`}
                />
                <div>
                  <h3>{RATIOS[d.ratio].label}</h3>
                  <p>
                    {d.document.canvas.width} × {d.document.canvas.height} px
                  </p>
                  {saved ? (
                    <Link className="button" href={`/editor/${d.id}`}>
                      Open in editor →
                    </Link>
                  ) : (
                    <span>Editable after saving</span>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="package-actions">
            {!saved && (
              <button
                className="button button-outline"
                disabled={busy}
                onClick={() => {
                  setStep(2);
                  setBundle(null);
                }}
              >
                ← Adjust information / style
              </button>
            )}
            {!saved && (
              <button
                className="button"
                disabled={busy || bundle.warnings.length > 0}
                onClick={save}
              >
                {busy
                  ? "Saving…"
                  : `Save ${bundle.designs.length === 4 ? "design package" : "design"}`}
              </button>
            )}
            {saved && (
              <Link className="button" href="/editor">
                My designs →
              </Link>
            )}
            <button className="button button-outline" onClick={backup}>
              Download editable project files
            </button>
          </div>
          <p className="template-count">
            Update all matching designs from Campaigns, or customize a single design in the editor.
          </p>
        </>
      )}
      <input
        hidden
        ref={upload}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files.length) photo([...e.target.files]);
          e.target.value = "";
        }}
      />
    </section>
  );
}
