"use client";
import { PRESETS, FONTS, reorder } from "@/lib/editor/document";
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
export function CanvasSettings({ doc, apply, dimensions, setDimensions }) {
  return (
    <>
      <h2>Resize canvas</h2>
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
      <div className="export-size">
        <strong>
          {doc.canvas.width} × {doc.canvas.height}
        </strong>
        <span>pixels · current canvas</span>
      </div>
      <ToolButton
        icon="download"
        className="editor-primary panel-wide"
        disabled={exporting}
        onClick={exportImage}
      >
        {exporting
          ? "Preparing artwork…"
          : `Download ${format === "png" ? "PNG" : "JPG"}`}
      </ToolButton>
      <details className="studio-details" open>
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
  duplicate,
  remove,
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
  onPaste,
}) {
  if (!element)
    return (
      <>
        <div className="panel-eyebrow">MAKE IT YOURS</div>
        <h2>Your canvas</h2>
        <div className="selection-empty">
          <span>Select an element</span>
          <p>
            Click an item on the canvas or choose it from Layers to see its
            editing tools.
          </p>
        </div>
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
      <h2>{selectionLabel(element)} properties</h2>
      <div className="editor-row element-actions">
        <ToolButton
          icon={element.locked ? "unlock" : "lock"}
          onClick={() => change(element.id, { locked: !element.locked })}
        >
          {element.locked ? "Unlock" : "Lock"}
        </ToolButton>
        <ToolButton icon="copy" onClick={duplicate}>
          Duplicate
        </ToolButton>
        <ToolButton icon="trash" onClick={remove} disabled={element.locked}>
          Delete
        </ToolButton>
      </div>
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
            <label className="editor-field">
              Text
              <textarea
                value={element.text}
                maxLength={5000}
                onChange={(e) => prop("text", e.target.value)}
              />
            </label>
            <ToolButton
              icon="edit"
              className="panel-wide"
              onClick={() => {
                setEditId(element.id);
                setMobile("");
              }}
            >
              Edit on canvas
            </ToolButton>
            <label className="editor-field">
              Font
              <select
                value={element.fontFamily}
                onChange={(e) => prop("fontFamily", e.target.value)}
              >
                {FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <div className="editor-fields">
              <Field
                label="Font size"
                value={element.fontSize}
                min={6}
                max={600}
                onChange={(v) => prop("fontSize", v)}
              />
              <label className="editor-field">
                Weight
                <select
                  value={element.fontWeight}
                  onChange={(e) => prop("fontWeight", e.target.value)}
                >
                  <option value="normal">Regular</option>
                  <option value="bold">Bold</option>
                </select>
              </label>
            </div>
            <label className="editor-field">
              Alignment
              <select
                value={element.align}
                onChange={(e) => prop("align", e.target.value)}
              >
                {["left", "center", "right"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {element.type !== "image" && (
          <label className="editor-field">
            {element.type === "text" ? "Text color" : "Fill color"}
            <input
              type="color"
              value={element.fill}
              onChange={(e) => prop("fill", e.target.value)}
            />
          </label>
        )}
        {element.type === "image" && (
          <>
            <ToolButton
              icon="image"
              className="panel-wide"
              onClick={() => replace.current.click()}
            >
              Replace image
            </ToolButton>
            <details className="studio-details" open>
              <summary>Crop image</summary>
              <p className="editor-small">
                Adjust the visible part of the source photo. The frame stays in
                place.
              </p>
              <div className="editor-fields">
                {["x", "y", "width", "height"].map((k) => (
                  <Field
                    key={k}
                    label={`Crop ${k} %`}
                    value={element.crop[k] * 100}
                    min={k === "width" || k === "height" ? 1 : 0}
                    max={100}
                    onChange={(v) =>
                      prop("crop", { ...element.crop, [k]: v / 100 })
                    }
                  />
                ))}
              </div>
              <div className="editor-row">
                <ToolButton
                  icon="crop"
                  onClick={() =>
                    prop("crop", { x: 0, y: 0, width: 1, height: 1 })
                  }
                >
                  Reset crop
                </ToolButton>
                <ToolButton
                  icon="crop"
                  onClick={() =>
                    prop("crop", { x: 0.15, y: 0.15, width: 0.7, height: 0.7 })
                  }
                >
                  Center crop
                </ToolButton>
              </div>
            </details>
          </>
        )}
        <Field
          label="Opacity"
          value={element.opacity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => prop("opacity", v)}
        />
        {["rect", "ellipse"].includes(element.type) && (
          <details className="studio-details" open>
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
        <details className="studio-details">
          <summary>Position & advanced</summary>
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
          {element.type === "text" && (
            <Field
              label="Line spacing"
              value={element.lineHeight}
              min={0.5}
              max={3}
              step={0.05}
              onChange={(v) => prop("lineHeight", v)}
            />
          )}
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
      <button className="panel-wide" onClick={() => setSelected(null)}>
        Deselect · canvas settings
      </button>
    </>
  );
}
