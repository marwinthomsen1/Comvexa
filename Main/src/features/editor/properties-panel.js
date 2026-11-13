"use client";
import {useRef} from "react";
import PhotoControls from "./photo-controls";
import TypographyControls from "./typography-controls";
import { PRESETS, reorder } from "@/lib/editor/document";
import { ToolButton } from "@/components/ui/studio-icon";
import { selectionLabel } from "./studio-tools";
function Field({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="editor-field">
      {label}
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          if (e.target.value !== "" && e.target.validity.valid)
            onChange(Number(e.target.value));
        }}
      />
    </label>
  );
}
export function CanvasSettings({ doc, apply, dimensions, setDimensions, expanded = false }) {
  return (
    <>
      <label className="editor-field">
        Background color
        <input
          type="color"
          value={doc.canvas.background}
          onChange={(e) =>
            apply({
              ...doc,
              canvas: { ...doc.canvas, background: e.target.value },
            })
          }
        />
      </label>
      <details className="studio-details" open={expanded}><summary>Canvas size · {doc.canvas.width} × {doc.canvas.height}</summary>
      <p className="editor-small">
        Change the page size. Existing elements keep their positions and sizes.
      </p>
      <label className="editor-field">
        Canvas preset
        <select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            const [width, height] = PRESETS[e.target.value];
            apply({ ...doc, canvas: { ...doc.canvas, width, height } });
            setDimensions({ width, height });
          }}
        >
          <option value="">Choose a preset…</option>
          {Object.entries(PRESETS).map(([key, [w, h, label]]) => (
            <option key={key} value={key}>
              {label} · {w} × {h}
            </option>
          ))}
        </select>
      </label>
      <div className="editor-fields">
        <Field
          label="Canvas width"
          value={dimensions.width}
          min={64}
          max={4096}
          onChange={(v) => setDimensions((d) => ({ ...d, width: v }))}
        />
        <Field
          label="Canvas height"
          value={dimensions.height}
          min={64}
          max={4096}
          onChange={(v) => setDimensions((d) => ({ ...d, height: v }))}
        />
      </div>
      <ToolButton
        icon="resize"
        onClick={() =>
          apply({ ...doc, canvas: { ...doc.canvas, ...dimensions } })
        }
      >
        Apply dimensions
      </ToolButton>
      <p className="editor-small">
        64–4096 px per edge. A4 is a pixel preset, not a print-quality
        guarantee. No bleed or CMYK output.
      </p>

      </details>
    </>
  );
}
export function ExportPanel({
  doc,
  format,
  setFormat,
  quality,
  setQuality,
  exporting,
  exportImage,
  projectFile,
  portable,
  upgradeBackup,
  exportAllPages,
}) {
  return (
    <>
      <div className="panel-eyebrow">READY TO SHARE</div>
      <h2>Download your design</h2>
      <p className="editor-small">
        Artwork only. No selection handles, connection badges or watermarks.
      </p>
      <label className="editor-field">
        Format
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="png">PNG · lossless</option>
          <option value="jpeg">JPG · smaller image</option>
        </select>
      </label>
      <label className="editor-field">
        Quality
        <select
          disabled={format === "png"}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
        >
          <option value={0.8}>Standard · 80%</option>
          <option value={0.92}>High · 92%</option>
          <option value={1}>Maximum · 100%</option>
        </select>
      </label>
      {doc.pages&&<div className="smart-action-row"><button disabled={exporting} onClick={()=>exportAllPages("zip")}>All {doc.pages.length} pages · ZIP</button><button disabled={exporting} onClick={()=>exportAllPages("pdf")}>All pages · PDF</button><p className="editor-small">Raster PDF: A4 presets use 300 ppi sizing; other sizes use 96 ppi. RGB only; no bleed, CMYK or PDF/X.</p></div>}
      <div className="export-size">
        <strong>
          {doc.canvas.width} × {doc.canvas.height}
        </strong>
        <span>pixels · current page</span>
      </div>
      <ToolButton
        icon="download"
        className="editor-primary panel-wide"
        disabled={exporting}
        onClick={exportImage}
      >
        {exporting
          ? "Preparing artwork…"
          : `Current page · ${format === "png" ? "PNG" : "JPG"}`}
      </ToolButton>
      <details className="studio-details">
        <summary>Editable project & backup</summary>
        <p className="editor-small">
          Keep an editable copy with its connected campaign information. Browser
          storage is not a backup.
        </p>
        <ToolButton icon="file" className="panel-wide" onClick={projectFile}>
          Download editable project
        </ToolButton>
        {upgradeBackup && (
          <ToolButton
            icon="file"
            className="panel-wide"
            onClick={upgradeBackup}
          >
            Download pre-upgrade backup
          </ToolButton>
        )}
        <ToolButton
          icon="upload"
          className="panel-wide"
          onClick={() => portable.current.click()}
        >
          Import project file
        </ToolButton>
      </details>
    </>
  );
}
export function PropertiesPanel({
  element,
  connectionPanel,
  doc,
  change,
  prop,
  aspect,
  setAspect,
  setEditId,
  setMobile,
  apply,
  setSelected,
  dimensions,
  setDimensions,
  replace,
  onCrop,
  onCompare,
  onPaste,
}) {
  const more = useRef(null);
  if (!element)
    return (
      <>
        <div className="panel-eyebrow">MAKE IT YOURS</div>
        <h2>Your canvas</h2>
        <p className="editor-small">Select something to edit, or change your canvas below.</p>
        <ToolButton icon="paste" className="panel-wide" onClick={onPaste}>
          Paste copied selection
        </ToolButton>
        <CanvasSettings
          doc={doc}
          apply={apply}
          dimensions={dimensions}
          setDimensions={setDimensions}
        />
      </>
    );
  return (
    <>
      <div className="panel-eyebrow">SELECTED ELEMENT</div>
      <h2>{selectionLabel(element)}</h2>
      {connectionPanel}
      {element.locked && (
        <p className="locked-message">
          This element is locked. Unlock it to edit.
        </p>
      )}
      <fieldset disabled={element.locked}>
        <legend className="sr-only">Element appearance</legend>
        {element.type === "text" && (
          <>
            <TypographyControls key={element.id} element={element} onPatch={patch=>change(element.id,patch)} Field={Field}/>
            <details className="studio-details"><summary>Edit text content</summary><textarea aria-label="Text content" value={element.text} maxLength={5000} onChange={e=>prop("text",e.target.value)}/><ToolButton icon="type" onClick={()=>{setEditId(element.id);setMobile("");}}>Edit on canvas</ToolButton></details>
          </>
        )}
        {!["image","text"].includes(element.type) && (
          <label className="editor-field">
            {element.type === "text" ? "Text color" : "Fill color"}
            <input
              type="color"
              value={element.fill}
              onChange={(e) => prop("fill", e.target.value)}
            />
          </label>
        )}
        {element.type === "image" && <PhotoControls onCompare={onCompare} key={element.id} asset={doc.assets[element.assetId]} element={element} onPatch={patch=>change(element.id,patch)} onCrop={onCrop} onReplace={()=>replace.current.click()} onMore={()=>{more.current.open=!more.current.open;more.current.scrollIntoView({block:"nearest"});}}/>}
        {element.type !== "text" && <label className="photo-slider">Opacity<output>{Math.round(element.opacity*100)}%</output><input type="range" min={0} max={1} step={.01} value={element.opacity} onChange={e=>prop("opacity",Number(e.target.value))}/></label>}
        {["rect", "ellipse"].includes(element.type) && (
          <details className="studio-details">
            <summary>{element.graphicKind ? "Border" : "Border & corners"}</summary>
            <label className="editor-field">
              Border color
              <input
                type="color"
                value={element.stroke}
                onChange={(e) => prop("stroke", e.target.value)}
              />
            </label>
            <Field
              label="Border width"
              value={element.strokeWidth}
              min={0}
              max={100}
              onChange={(v) => prop("strokeWidth", v)}
            />
            {element.type === "rect" && !element.graphicKind && (
              <Field
                label="Corner radius"
                value={element.cornerRadius}
                min={0}
                max={1000}
                onChange={(v) => prop("cornerRadius", v)}
              />
            )}
          </details>
        )}
        <details ref={more} className="studio-details">
          <summary>More · position & sizing</summary>
          <div className="editor-fields">
            {["x", "y", "width", "height", "rotation"].map((k) => (
              <Field
                key={k}
                label={k[0].toUpperCase() + k.slice(1)}
                value={element[k]}
                min={
                  k === "width" || k === "height"
                    ? 1
                    : k === "rotation"
                      ? -360
                      : -8192
                }
                max={k === "rotation" ? 360 : 8192}
                onChange={(v) => prop(k, v)}
              />
            ))}
          </div>
          <label className="editor-check">
            <input
              type="checkbox"
              checked={aspect}
              onChange={(e) => setAspect(e.target.checked)}
            />
            Lock aspect ratio
          </label>
          {element.type === "image" && <details className="studio-details"><summary>Exact crop values</summary><div className="editor-fields">{["x","y","width","height"].map(k=><Field key={k} label={`Crop ${k} %`} value={element.crop[k]*100} min={k==="width"||k==="height"?1:0} max={100} onChange={v=>prop("crop",{...element.crop,[k]:v/100})}/>)}</div></details>}
        </details>
      </fieldset>
      <details className="studio-details">
        <summary>Arrange element</summary>
        <div className="editor-row">
          <ToolButton
            icon="down"
            onClick={() => apply(reorder(doc, element.id, -1))}
          >
            Send backward
          </ToolButton>
          <ToolButton
            icon="up"
            onClick={() => apply(reorder(doc, element.id, 1))}
          >
            Bring forward
          </ToolButton>
        </div>
      </details>
      <button className="subtle-button" onClick={() => setSelected(null)}>
        Deselect · canvas settings
      </button>
    </>
  );
}
