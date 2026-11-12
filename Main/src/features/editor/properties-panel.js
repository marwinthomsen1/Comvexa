"use client";
import { PRESETS, FONTS, reorder } from "@/lib/editor/document";
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
export function PropertiesPanel({
  element,
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
  format,
  setFormat,
  quality,
  setQuality,
  exporting,
  exportImage,
  projectFile,
  exportAnchor,
  portable,
  replace,
}) {
  return (
    <>
      <h2>
        {element
          ? `${element.type[0].toUpperCase() + element.type.slice(1)} properties`
          : "Canvas settings"}
      </h2>
      {element ? (
        <>
          <div className="editor-row">
            <button
              onClick={() => change(element.id, { locked: !element.locked })}
            >
              {element.locked ? "Unlock" : "Lock"}
            </button>
            <button onClick={duplicate}>Duplicate</button>
            <button onClick={remove} disabled={element.locked}>
              Delete
            </button>
          </div>
          <fieldset disabled={element.locked}>
            <legend>
              {element.locked
                ? "Locked — unlock to edit"
                : "Position & appearance"}
            </legend>
            <div className="editor-fields">
              <Field
                label="X"
                value={element.x}
                onChange={(v) => prop("x", v)}
                min={-8192}
                max={8192}
              />
              <Field
                label="Y"
                value={element.y}
                onChange={(v) => prop("y", v)}
                min={-8192}
                max={8192}
              />
              <Field
                label="Width"
                value={element.width}
                onChange={(v) => prop("width", v)}
                min={1}
                max={8192}
              />
              <Field
                label="Height"
                value={element.height}
                onChange={(v) => prop("height", v)}
                min={1}
                max={8192}
              />
              <Field
                label="Rotation"
                value={element.rotation}
                onChange={(v) => prop("rotation", v)}
                min={-360}
                max={360}
              />
              <Field
                label="Opacity"
                value={element.opacity}
                onChange={(v) => prop("opacity", v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
            <label className="editor-check">
              <input
                type="checkbox"
                checked={aspect}
                onChange={(e) => setAspect(e.target.checked)}
              />{" "}
              Lock aspect ratio
            </label>
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
                <button
                  onClick={() => {
                    setEditId(element.id);
                    setMobile("");
                  }}
                >
                  Edit on canvas
                </button>
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
                    onChange={(v) => prop("fontSize", v)}
                    min={6}
                    max={600}
                  />
                  <Field
                    label="Line spacing"
                    value={element.lineHeight}
                    onChange={(v) => prop("lineHeight", v)}
                    min={0.5}
                    max={3}
                    step={0.05}
                  />
                </div>
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
            {["rect", "ellipse"].includes(element.type) && (
              <>
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
                  onChange={(v) => prop("strokeWidth", v)}
                  min={0}
                  max={100}
                />
                {element.type === "rect" && (
                  <Field
                    label="Corner radius"
                    value={element.cornerRadius}
                    onChange={(v) => prop("cornerRadius", v)}
                    min={0}
                    max={1000}
                  />
                )}
              </>
            )}
            {element.type === "image" && (
              <>
                <h3>Crop source image</h3>
                <p className="editor-small">
                  Percentages of the original image. The frame stays in place.
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
                <button
                  onClick={() =>
                    prop("crop", { x: 0, y: 0, width: 1, height: 1 })
                  }
                >
                  Reset crop
                </button>
                <button
                  onClick={() =>
                    prop("crop", { x: 0.15, y: 0.15, width: 0.7, height: 0.7 })
                  }
                >
                  Center crop
                </button>
                <button onClick={() => replace.current.click()}>
                  Replace image
                </button>
              </>
            )}
          </fieldset>
          <div className="editor-row">
            <button onClick={() => apply(reorder(doc, element.id, -1))}>
              Send backward
            </button>
            <button onClick={() => apply(reorder(doc, element.id, 1))}>
              Bring forward
            </button>
          </div>
          <button onClick={() => setSelected(null)}>Canvas settings</button>
        </>
      ) : (
        <>
          <label className="editor-field">
            Canvas preset
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                const [width, height] = PRESETS[e.target.value];
                apply({ ...doc, canvas: { ...doc.canvas, width, height } });
                setDimensions({ width, height });
              }}
            >
              <option value="">Custom / choose preset</option>
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
          <button
            onClick={() =>
              apply({ ...doc, canvas: { ...doc.canvas, ...dimensions } })
            }
          >
            Apply dimensions
          </button>
          <p className="editor-small">
            64–4096 px per edge. A4 uses 2480 × 3508 px at nominal 300 ppi.
            Raster exports have no bleed, CMYK or embedded print-resolution
            guarantee; confirm printer requirements.
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
      )}
      <hr />
      <h3 ref={exportAnchor}>Export artwork</h3>
      <label className="editor-field">
        Format
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="png">PNG · lossless</option>
          <option value="jpeg">JPG · background included</option>
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
      <button
        className="editor-primary"
        disabled={exporting}
        onClick={exportImage}
      >
        {exporting
          ? "Preparing artwork…"
          : `Download ${format === "png" ? "PNG" : "JPG"}`}
      </button>
      <p className="editor-small">
        {doc.canvas.width} × {doc.canvas.height} px. Artwork only; no handles or
        watermark.
      </p>
      <button onClick={projectFile}>Download editable project</button>
      <button onClick={() => portable.current.click()}>
        Import project file
      </button>
    </>
  );
}
