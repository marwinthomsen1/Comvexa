"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DesignCanvas from "./design-canvas";
import { StudioIcon, ToolButton } from "@/components/ui/studio-icon";
import { STUDIO_TOOLS, selectionLabel, connectionLabel } from "./studio-tools";
import { leaveStudio } from "./studio-session";
import { sampleAsset } from "@/lib/templates/assets";
import Image from "next/image";
import {
  PropertiesPanel,
  ExportPanel,
  CanvasSettings,
} from "./properties-panel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Brand } from "@/components/layout/brand";
import {
  newDesign,
  validateDocument,
  makeElement,
  addElement,
  patchElement,
  history,
  commit,
  undo,
  redo,
  PRESETS,
} from "@/lib/editor/document";
import { designStore } from "@/lib/editor/store";
import { readImage, verifyAssets } from "@/lib/editor/images";
import { download, renderExport } from "@/lib/editor/export";
import { readWorkspace } from "@/lib/workspace/local-store";
import { PROJECT_SIZES } from "@/lib/workspace/validation";
import "./editor.css";
import "@/features/connected/connected.css";
import { ConnectionPanel } from "@/features/connected/connection-panel";
import { subscribeChanges } from "@/lib/connected/store";
import {
  resolveDocument,
  parsePortable,
  MAX_PORTABLE_BYTES,
} from "@/lib/connected/model";
import { documentWarnings, browserMeasure } from "@/lib/templates/fitting";
export default function Editor() {
  const { id } = useParams(),
    router = useRouter();
  const [state, setState] = useState(null),
    [selected, setSelected] = useState(null),
    [tab, setTab] = useState("Text"),
    [mobile, setMobile] = useState(""),
    [error, setError] = useState(""),
    [status, setStatus] = useState("Opening…"),
    [zoom, setZoom] = useState(0.5),
    [preview, setPreview] = useState(false),
    [editId, setEditId] = useState(null),
    [aspect, setAspect] = useState(false),
    [exporting, setExporting] = useState(false),
    [format, setFormat] = useState("png"),
    [quality, setQuality] = useState(0.92),
    [dimensions, setDimensions] = useState({ width: 1080, height: 1080 });
  const [campaigns, setCampaigns] = useState([]),
    [available, setAvailable] = useState([]);
  const inFlight = useRef(0);
  const [panel, setPanel] = useState("selection");
  const [layerSearch, setLayerSearch] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const toolsSheet = useRef(null),
    propertiesSheet = useRef(null);
  const viewport = useRef(null),
    revision = useRef(0),
    saved = useRef(""),
    latest = useRef(null),
    queue = useRef(Promise.resolve()),
    upload = useRef(null),
    replace = useRef(null),
    portable = useRef(null),
    mounted = useRef(true),
    conflict = useRef(false);
  const [nameDraft, setNameDraft] = useState("");
  const doc = state?.present;
  useEffect(() => {
    if (!mobile || !window.matchMedia("(max-width: 900px)").matches) return;
    const previous = document.activeElement;
    const sheet =
      mobile === "tools" ? toolsSheet.current : propertiesSheet.current;
    sheet?.querySelector("button")?.focus();
    function trap(e) {
      if (e.key === "Escape") {
        setMobile("");
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const items = [
        ...sheet.querySelectorAll(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary",
        ),
      ].filter((n) => n.getClientRects().length);
      const first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [mobile]);
  function openTool(name) {
    setTab(name);
    setMobile("tools");
    setPreview(false);
  }
  function openPanel(name = "selection") {
    setPanel(name);
    setMobile("properties");
    setPreview(false);
  }
  const overflowWarnings = useMemo(
    () => (doc ? documentWarnings(doc, browserMeasure) : []),
    [doc],
  );
  useEffect(() => {
    if (doc) setNameDraft(doc.name);
  }, [doc?.name]);
  latest.current = doc;
  useEffect(() => {
    mounted.current = true;
    let active = true;
    if (id === "new") {
      router.replace(`/editor/${crypto.randomUUID()}`);
      return;
    }
    async function load() {
      try {
        const record = await designStore.loadConnected(id);
        let document;
        if (record) {
          document = record.document;
          await verifyAssets(document);
        } else {
          let project;
          try {
            project = readWorkspace(localStorage).projects.find(
              (p) => p.id === id,
            );
          } catch {
            /* Project metadata is optional; design records stay separate. */
          }
          const size = PROJECT_SIZES[project?.size] || PRESETS.square;
          document = newDesign(
            project?.name || "Untitled design",
            size.width || size[0],
            size.height || size[1],
          );
        }
        if (!active) return;
        setCampaigns(record?.campaigns || []);
        if (record?.connectionWarnings?.length)
          setError(record.connectionWarnings.join(" "));
        revision.current = record?.revision || 0;
        saved.current = record ? JSON.stringify(document) : "";
        conflict.current = false;
        setState(history(document));
        setDimensions(document.canvas);
        setStatus(record ? "Saved in this browser" : "Unsaved local design");
      } catch (e) {
        if (active) {
          setError(e.message);
          if (
            /storage is unavailable|Close other editor tabs/i.test(e.message)
          ) {
            const blank = newDesign("Unsaved design — memory only");
            saved.current = "";
            revision.current = 0;
            setState(history(blank));
            setDimensions(blank.canvas);
            setStatus("Storage unavailable — download a project file");
          }
        }
      }
    }
    load();
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [id, router]);
  const save = useCallback(
    (snapshot) => {
      if (!snapshot) return Promise.resolve(false);
      setStatus("Saving…");
      inFlight.current++;
      const task = queue.current
        .then(async () => {
          if (conflict.current)
            throw new Error(
              "Another tab changed this design. Download a project file and reload.",
            );
          const next = await designStore.save(id, snapshot, revision.current);
          revision.current = next;
          saved.current = JSON.stringify(snapshot);
          if (mounted.current)
            setStatus(
              JSON.stringify(latest.current) === saved.current
                ? "Saved in this browser"
                : "Unsaved changes",
            );
          return true;
        })
        .catch((e) => {
          if (/another tab/i.test(e.message)) conflict.current = true;
          if (mounted.current) {
            setStatus("Save failed — download a project file");
            setError(e.message);
          }
          return false;
        })
        .finally(() => {
          inFlight.current--;
        });
      queue.current = task;
      return task;
    },
    [id],
  );
  useEffect(() => {
    if (!doc || JSON.stringify(doc) === saved.current) return;
    setStatus("Unsaved changes");
    const timer = setTimeout(() => save(doc), 800);
    return () => clearTimeout(timer);
  }, [doc, save]);
  useEffect(() => {
    const leave = (e) => {
      if (latest.current && JSON.stringify(latest.current) !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  useEffect(() => {
    designStore
      .listPackages()
      .then(setAvailable)
      .catch((e) => setError(e.message));
  }, []);
  async function refreshConnected(force = false) {
    if (inFlight.current && !force) return;
    try {
      const record = await designStore.loadConnected(id);
      if (!record) return;
      if (record.revision === revision.current && !force) return;
      if (
        !force &&
        latest.current &&
        JSON.stringify(latest.current) !== saved.current
      ) {
        conflict.current = true;
        setError(
          "This design changed through its campaign or another tab. Your unsaved work is kept. Download a recovery project before reloading.",
        );
        return;
      }
      revision.current = record.revision;
      saved.current = JSON.stringify(record.document);
      conflict.current = false;
      setCampaigns(record.campaigns);
      setState((old) => ({ ...old, present: record.document }));
      setStatus("Updated from shared campaign");
      setError(record.connectionWarnings.join(" "));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => subscribeChanges(() => refreshConnected()), [id]);
  async function chooseCampaign(campaignId) {
    if (!campaignId) return;
    try {
      const next = await designStore.campaignSnapshot(campaignId);
      setCampaigns([next.campaign]);
    } catch (e) {
      setError(e.message);
    }
  }
  function apply(next) {
    try {
      const checked = resolveDocument(validateDocument(next), campaigns, {
        strict: false,
      }).document;
      setState((old) => commit(old, checked));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  function change(id, patch) {
    try {
      const next = patchElement(latest.current, id, patch);
      apply(next);
    } catch (e) {
      setError(e.message);
    }
  }
  const element = doc?.elements.find((e) => e.id === selected);
  function add(type) {
    try {
      const e = makeElement(type, crypto.randomUUID());
      apply(addElement(doc, e));
      setSelected(e.id);
      setPanel("selection");
      setMobile("properties");
    } catch (e) {
      setError(e.message);
    }
  }
  function remove() {
    if (!element || element.locked) return;
    apply({ ...doc, elements: doc.elements.filter((e) => e.id !== selected) });
    setSelected(null);
  }
  function duplicate() {
    if (!element) return;
    const e = {
      ...element,
      id: crypto.randomUUID(),
      x: Math.min(8192, element.x + 20),
      y: Math.min(8192, element.y + 20),
      locked: false,
    };
    apply(addElement(doc, e));
    setSelected(e.id);
  }
  function actionHistory(action) {
    setEditId(null);
    setState((s) => {
      const next = action(s);
      return {
        ...next,
        present: resolveDocument(next.present, campaigns, { strict: false })
          .document,
      };
    });
  }
  useEffect(() => {
    function key(e) {
      if (
        /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) ||
        e.target.isContentEditable
      )
        return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(latest.current);
        return;
      }
      if (!latest.current || preview) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        actionHistory(e.shiftKey ? redo : undo);
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        actionHistory(redo);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      } else if (e.key === "Escape") {
        setSelected(null);
        setMobile("");
        setEditId(null);
      } else if (
        element &&
        !element.locked &&
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        e.preventDefault();
        const distance = e.shiftKey ? 10 : 1;
        change(element.id, {
          x:
            element.x +
            (e.key === "ArrowRight"
              ? distance
              : e.key === "ArrowLeft"
                ? -distance
                : 0),
          y:
            element.y +
            (e.key === "ArrowDown"
              ? distance
              : e.key === "ArrowUp"
                ? -distance
                : 0),
        });
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  function fit() {
    if (!doc || !viewport.current) return;
    const box = viewport.current.getBoundingClientRect();
    setZoom(
      Math.max(
        0.05,
        Math.min(
          1,
          (box.width - 80) / doc.canvas.width,
          (box.height - 80) / doc.canvas.height,
        ),
      ),
    );
  }
  useEffect(() => {
    if (!doc) return;
    const node = viewport.current;
    const observer = new ResizeObserver(() => {
      const b = node.getBoundingClientRect();
      setZoom(
        Math.max(
          0.05,
          Math.min(
            1,
            (b.width - 80) / doc.canvas.width,
            (b.height - 80) / doc.canvas.height,
          ),
        ),
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [doc?.canvas.width, doc?.canvas.height]);
  async function imageFile(file, replacing = false) {
    try {
      const asset = await readImage(file);
      const assetId = crypto.randomUUID();
      let next = {
        ...latest.current,
        assets: { ...latest.current.assets, [assetId]: asset },
      };
      let e;
      if (replacing && element?.type === "image") {
        next = patchElement(next, element.id, {
          assetId,
          crop: { x: 0, y: 0, width: 1, height: 1 },
        });
      } else {
        const width = Math.min(600, asset.width, doc.canvas.width * 0.8);
        e = {
          ...makeElement("image", crypto.randomUUID()),
          width,
          height: (width * asset.height) / asset.width,
          assetId,
          crop: { x: 0, y: 0, width: 1, height: 1 },
        };
        next = addElement(next, e);
      }
      apply(next);
      if (e) setSelected(e.id);
      setPanel("selection");
      setMobile("properties");
    } catch (e) {
      setError(e.message);
    }
  }
  async function importProject(file) {
    try {
      if (!file || file.size > MAX_PORTABLE_BYTES)
        throw new Error("Project files must be at most 64 MB.");
      let input = JSON.parse(await file.text());
      const parsed = parsePortable(input);
      await verifyAssets(parsed.document);
      for (const c of parsed.campaigns) {
        for (const a of Object.values(c.assets))
          await verifyAssets({ assets: { photo: a } });
      }
      if (!parsed.campaigns.length) {
        const missing = parsed.document.elements.filter(
          (e) =>
            e.binding && !available.some((c) => c.id === e.binding.campaignId),
        );
        if (missing.length) {
          if (
            !window.confirm(
              "This older project references campaigns unavailable in this browser. Import the cached artwork as independent content? No shared information will be invented.",
            )
          )
            return;
          input = {
            ...parsed.document,
            elements: parsed.document.elements.map((e) =>
              missing.some((m) => m.id === e.id)
                ? { ...e, binding: null, localOverride: false }
                : e,
            ),
          };
        }
      }
      if (
        doc.elements.length &&
        !window.confirm(
          "Replace this canvas with the imported project? You can undo the canvas change. Imported campaigns are kept separately.",
        )
      )
        return;
      const result = await designStore.importConnected(
        id,
        input,
        revision.current,
      );
      revision.current = result.revision;
      saved.current = JSON.stringify(result.document);
      setCampaigns(result.campaigns);
      setState((old) => commit(old, result.document));
      setSelected(null);
      setDimensions(result.document.canvas);
      setStatus("Imported and saved in this browser");
      setError("");
      designStore.listPackages().then(setAvailable);
    } catch (e) {
      setError("Import failed: " + e.message);
    }
  }
  async function projectFile() {
    try {
      const value = await designStore.portable(doc);
      download(
        new Blob([JSON.stringify(value)], { type: "application/json" }),
        `${doc.name}.comvexa.json`,
      );
    } catch (e) {
      download(
        new Blob([JSON.stringify(doc)], { type: "application/json" }),
        `${doc.name}.recovery.comvexa.json`,
      );
      setError("Recovery artwork downloaded with cached values: " + e.message);
    }
  }
  async function exportImage() {
    setExporting(true);
    setError("");
    try {
      const snapshot = await designStore.exportSnapshot(
        id,
        doc,
        revision.current,
      );
      const blob = await renderExport(snapshot.document, format, quality);
      download(blob, `${doc.name}.${format === "jpeg" ? "jpg" : "png"}`);
    } catch (e) {
      setError("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  }
  async function goBack(e) {
    e.preventDefault();
    await navigateSafely("/editor");
  }
  function starter(kind) {
    if (
      doc.elements.length &&
      !window.confirm(
        "Replace this canvas with a starter? Undo restores your current design.",
      )
    )
      return;
    let next = newDesign(doc.name, 1080, 1350);
    next.canvas.background = kind === "invitation" ? "#fff1d0" : "#262096";
    const a = {
      ...makeElement("rect", crypto.randomUUID()),
      x: 700,
      y: -100,
      width: 600,
      height: 600,
      fill: kind === "invitation" ? "#fab8d6" : "#ef81cf",
      cornerRadius: 300,
    };
    const b = {
      ...makeElement("text", crypto.randomUUID()),
      x: 100,
      y: 300,
      width: 880,
      height: 600,
      text:
        kind === "invitation"
          ? "You’re invited.\nLet’s celebrate!"
          : "MAKE\nSOME\nNOISE.",
      fontFamily: kind === "invitation" ? "Georgia" : "Arial",
      fontSize: kind === "invitation" ? 120 : 170,
      fill: kind === "invitation" ? "#8e2d64" : "#edff7a",
    };
    next.elements = [a, b];
    apply(next);
    setDimensions(next.canvas);
    setSelected(b.id);
  }
  if (!doc)
    return (
      <main className="editor-loading">
        <h1>Opening your design…</h1>
        {error && (
          <p role="alert">{error} Existing records have been preserved.</p>
        )}
        <Link href="/editor">Back to designs</Link>
      </main>
    );
  function prop(key, value) {
    if (!element || element.locked) return;
    let patch = { [key]: value };
    if (aspect && ["width", "height"].includes(key))
      patch[key === "width" ? "height" : "width"] =
        value *
        (key === "width"
          ? element.height / element.width
          : element.width / element.height);
    change(element.id, patch);
  }
  function navigateSafely(destination) {
    return leaveStudio({
      document: latest.current,
      savedDocument: saved.current,
      save,
      navigate: () => router.push(destination),
    });
  }
  async function browseTemplates() {
    await navigateSafely("/dashboard/templates");
  }

  async function insertPhoto(kind) {
    setPhotoBusy(true);
    try {
      const asset = await sampleAsset(kind),
        assetId = crypto.randomUUID();
      const current = latest.current;
      const width = Math.min(600, current.canvas.width * 0.8);
      const item = {
        ...makeElement("image", crypto.randomUUID()),
        width,
        height: (width * asset.height) / asset.width,
        assetId,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      };
      apply(
        addElement(
          { ...current, assets: { ...current.assets, [assetId]: asset } },
          item,
        ),
      );
      setSelected(item.id);
      openPanel();
    } catch (e) {
      setError(e.message);
    } finally {
      setPhotoBusy(false);
    }
  }
  const sidebar = (
    <>
      <div className="panel-eyebrow">YOUR CREATIVE TOOLKIT</div>
      <h2>{tab}</h2>
      {tab === "Text" && (
        <>
          <p>
            Add a headline, then double-click it to type directly on the canvas.
          </p>
          <ToolButton
            icon="type"
            className="text-add"
            onClick={() => add("text")}
          >
            Add a text box
          </ToolButton>
          <div className="text-preview">
            Your next
            <br />
            <strong>great idea.</strong>
          </div>
          <p>Choose its font, size and color in the selection panel.</p>
        </>
      )}
      {tab === "Templates" && (
        <>
          <p>Editable starter layouts, or browse the full template library.</p>
          <button onClick={() => starter("invitation")}>
            A little celebration
          </button>
          <button onClick={() => starter("event")}>Make some noise</button>
          <button onClick={browseTemplates}>
            Save & browse all templates →
          </button>
        </>
      )}
      {tab === "Uploads" && (
        <>
          <p>
            PNG, JPG or WebP. Up to 8 MB and 4096 × 4096 px. Optimized locally
            to a maximum 2048 px edge; never uploaded.
          </p>
          <button onClick={() => upload.current.click()}>
            Upload an image
          </button>
          <p>Use your own images or images you have permission to use.</p>
        </>
      )}
      {tab === "Elements" && (
        <>
          <ToolButton
            icon="square"
            className="shape-tile"
            onClick={() => add("rect")}
          >
            Rectangle
          </ToolButton>
          <ToolButton
            icon="circle"
            className="shape-tile"
            onClick={() => add("ellipse")}
          >
            Ellipse
          </ToolButton>
          <p>More graphics and decorative elements are planned for Stage C.</p>
        </>
      )}
      {tab === "Photos" && (
        <>
          <p>
            Original Comvexa artwork. Choose a photo to add it to your canvas.
          </p>
          <div className="studio-photos">
            {["fashion", "food", "travel", "beauty", "motors"].map((kind) => (
              <button
                key={kind}
                disabled={photoBusy}
                onClick={() => insertPhoto(kind)}
                aria-label={`Add ${kind === "motors" ? "motorcycle" : kind} photo`}
              >
                <Image
                  src={`/images/previews/${kind === "motors" ? "motorcycle" : kind}.webp`}
                  width={160}
                  height={160}
                  alt=""
                />
                <span>{kind === "motors" ? "Motorcycle" : kind}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "Resize" && (
        <CanvasSettings
          doc={doc}
          apply={apply}
          dimensions={dimensions}
          setDimensions={setDimensions}
        />
      )}
      {tab === "Backgrounds" && (
        <>
          <label className="editor-field">
            Canvas color
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
          <div className="editor-swatches">
            {[
              "#ffffff",
              "#17192b",
              "#fff1d0",
              "#262096",
              "#d6ff56",
              "#f9b6d8",
            ].map((color) => (
              <button
                aria-label={`Background ${color}`}
                style={{ background: color }}
                key={color}
                onClick={() =>
                  apply({
                    ...doc,
                    canvas: { ...doc.canvas, background: color },
                  })
                }
              />
            ))}
          </div>
        </>
      )}
      {tab === "Layers" && (
        <>
          <p>
            Top layer first. Select a layer to edit it, or use its lock control.
          </p>
          <label className="editor-field">
            Find a layer
            <input
              type="search"
              placeholder="Search text or type…"
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
            />
          </label>
          {!doc.elements.length && <p>No elements yet.</p>}
          {[...doc.elements]
            .reverse()
            .filter((e) =>
              (e.type + " " + (e.text || ""))
                .toLowerCase()
                .includes(layerSearch.toLowerCase()),
            )
            .map((e) => (
              <div
                className={`studio-layer ${selected === e.id ? "is-selected" : ""}`}
                key={e.id}
              >
                <button
                  aria-pressed={selected === e.id}
                  className="layer-item"
                  onClick={() => {
                    setSelected(e.id);
                    openPanel();
                  }}
                >
                  <StudioIcon
                    name={
                      e.type === "text"
                        ? "type"
                        : e.type === "image"
                          ? "image"
                          : "shapes"
                    }
                  />
                  <span>
                    {e.type === "text"
                      ? e.text.slice(0, 28) || "Empty text"
                      : selectionLabel(e)}
                    <small>{connectionLabel(e)}</small>
                  </span>
                </button>
                <button
                  title={e.locked ? "Unlock layer" : "Lock layer"}
                  aria-label={`${e.locked ? "Unlock" : "Lock"} ${e.type === "text" ? e.text.slice(0, 28) || "empty text" : e.type} layer`}
                  onClick={() => change(e.id, { locked: !e.locked })}
                >
                  <StudioIcon name={e.locked ? "lock" : "unlock"} />
                </button>
              </div>
            ))}
        </>
      )}
      <hr />
      <p className="editor-small">
        Shortcuts: ⌘/Ctrl Z undo · Shift Z redo · D duplicate · S save · arrows
        move · Shift arrows 10 px.
      </p>
    </>
  );
  const properties =
    panel === "export" ? (
      <ExportPanel
        doc={doc}
        format={format}
        setFormat={setFormat}
        quality={quality}
        setQuality={setQuality}
        exporting={exporting}
        exportImage={exportImage}
        projectFile={projectFile}
        portable={portable}
      />
    ) : (
      <PropertiesPanel
        element={element}
        doc={doc}
        change={change}
        duplicate={duplicate}
        remove={remove}
        prop={prop}
        aspect={aspect}
        setAspect={setAspect}
        setEditId={setEditId}
        setMobile={setMobile}
        apply={apply}
        setSelected={setSelected}
        dimensions={dimensions}
        setDimensions={setDimensions}
        format={format}
        setFormat={setFormat}
        quality={quality}
        setQuality={setQuality}
        exporting={exporting}
        exportImage={exportImage}
        projectFile={projectFile}
        portable={portable}
        replace={replace}
        connectionPanel={
          <ConnectionPanel
            element={element}
            doc={doc}
            campaigns={campaigns}
            available={available}
            onApply={apply}
            onError={setError}
            onChooseCampaign={chooseCampaign}
            onOpenCampaign={(event, campaignId) => {
              event.preventDefault();
              navigateSafely(`/dashboard/connected/${campaignId}`);
            }}
          />
        }
      />
    );

  return (
    <main
      id="main-content"
      className={`editor-shell ${preview ? "editor-previewing" : ""}`}
    >
      <header className="editor-top">
        <Brand
          href="/editor"
          onClick={goBack}
          label="Save and return to designs"
        />
        <input
          className="design-name"
          aria-label="Design name"
          value={nameDraft}
          maxLength={80}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            if (nameDraft.trim()) apply({ ...doc, name: nameDraft });
            else {
              setNameDraft(doc.name);
              setError("Design name is required.");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <div className="editor-history">
          <button
            disabled={!state.past.length || !!editId}
            onClick={() => actionHistory(undo)}
            aria-label="Undo"
            title="Undo · ⌘/Ctrl Z"
          >
            <StudioIcon name="undo" />
          </button>
          <button
            disabled={!state.future.length || !!editId}
            onClick={() => actionHistory(redo)}
            aria-label="Redo"
            title="Redo · ⌘/Ctrl Shift Z"
          >
            <StudioIcon name="redo" />
          </button>
        </div>
        <span role="status" className="save-status">
          {status}
        </span>
        <ToolButton
          icon="save"
          className="studio-save"
          onClick={() => save(doc)}
        >
          Save
        </ToolButton>
        <span className="editor-size">
          {doc.canvas.width} × {doc.canvas.height}
        </span>
        <button
          onClick={() => {
            setPreview(!preview);
            setMobile("");
          }}
        >
          <StudioIcon name="eye" />
          {preview ? "Edit" : "Preview"}
        </button>
        <ToolButton
          icon="resize"
          className="top-resize"
          onClick={() => openTool("Resize")}
        >
          Resize
        </ToolButton>
        <ToolButton
          icon="download"
          className="editor-primary studio-download"
          onClick={() => openPanel("export")}
        >
          Download
        </ToolButton>
        <ThemeToggle />
      </header>
      {overflowWarnings.length > 0 && (
        <div className="editor-overflow-warning" role="status">
          {overflowWarnings.length} text frame(s) may overflow. Enlarge the text
          frame or reduce font size before export.
        </div>
      )}
      <div className="editor-notice">
        BROWSER-LOCAL STUDIO{" "}
        <span>
          · Cloud backup unavailable. Download project files to keep a backup.
        </span>
      </div>
      {error && (
        <div className="editor-error" role="alert">
          {error}
          <button onClick={() => setError("")}>Dismiss</button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Reload saved design? Download your unsaved recovery project first if you need it.",
                )
              )
                refreshConnected(true);
            }}
          >
            Reload saved
          </button>
        </div>
      )}
      <nav className="editor-tabs" aria-label="Editor tools">
        {STUDIO_TOOLS.map((tool) => (
          <button
            key={tool.id}
            title={tool.hint}
            aria-label={tool.id}
            aria-pressed={tab === tool.id && !preview}
            onClick={() => openTool(tool.id)}
          >
            <StudioIcon name={tool.icon} />
            <span>{tool.id}</span>
          </button>
        ))}
        <button
          className="mobile-properties"
          aria-label="Selection properties"
          onClick={() => openPanel()}
        >
          <StudioIcon name="settings" />
          <span>Edit</span>
        </button>
      </nav>
      {mobile && (
        <button
          className="sheet-backdrop"
          aria-label="Close editing panel"
          onClick={() => setMobile("")}
        />
      )}
      {!preview && (
        <aside
          className={`editor-tools ${mobile === "tools" ? "sheet-open" : ""}`}
          ref={toolsSheet}
          role={mobile === "tools" ? "dialog" : undefined}
          aria-label={`${tab} tools`}
        >
          {mobile && (
            <button className="sheet-close" onClick={() => setMobile("")}>
              <StudioIcon name="close" /> Close tools
            </button>
          )}
          {sidebar}
        </aside>
      )}
      <section className="editor-center" aria-label="Design workspace">
        {!preview && (
          <div
            className="studio-context"
            role="toolbar"
            aria-label="Selection actions"
          >
            <div>
              <StudioIcon
                name={
                  element?.type === "text"
                    ? "type"
                    : element?.type === "image"
                      ? "image"
                      : "settings"
                }
              />
              <strong>{selectionLabel(element)}</strong>
              {element && (
                <span
                  className={`selection-state ${element.binding ? "is-connected" : ""}`}
                >
                  <StudioIcon
                    name={element.binding ? "link" : "shapes"}
                    size={13}
                  />
                  {connectionLabel(element)}
                </span>
              )}
            </div>
            <div>
              {element ? (
                <>
                  <ToolButton icon="edit" onClick={() => openPanel()}>
                    Edit
                  </ToolButton>
                  {element.type === "text" && (
                    <ToolButton
                      icon="type"
                      disabled={element.locked}
                      onClick={() => {
                        setEditId(element.id);
                        setMobile("");
                      }}
                    >
                      Type
                    </ToolButton>
                  )}
                  <ToolButton
                    icon="copy"
                    title="Duplicate · ⌘/Ctrl D"
                    aria-label="Duplicate selected element"
                    onClick={duplicate}
                  />
                  <ToolButton
                    icon={element.locked ? "unlock" : "lock"}
                    title={element.locked ? "Unlock" : "Lock"}
                    aria-label={
                      element.locked
                        ? "Unlock selected element"
                        : "Lock selected element"
                    }
                    onClick={() =>
                      change(element.id, { locked: !element.locked })
                    }
                  />
                  <ToolButton
                    icon="trash"
                    aria-label="Delete selected element"
                    title="Delete selected element"
                    disabled={element.locked}
                    onClick={remove}
                  />
                </>
              ) : (
                <span className="context-hint">
                  Choose a tool or select something to begin
                </span>
              )}
            </div>
          </div>
        )}

        <div className="editor-viewport" ref={viewport}>
          <div className="canvas-centering">
            <DesignCanvas
              doc={doc}
              selected={selected}
              select={(value) => {
                setSelected(value);
                setPanel("selection");
              }}
              patch={change}
              zoom={zoom}
              preview={preview}
              editId={editId}
              setEditId={setEditId}
              aspectLocked={aspect}
            />
          </div>
        </div>
        <div className="editor-zoom">
          <button
            onClick={() => setZoom((z) => Math.max(0.05, z - 0.1))}
            aria-label="Zoom out"
          >
            <StudioIcon name="zoomOut" />
          </button>
          <output>{Math.round(zoom * 100)}%</output>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            aria-label="Zoom in"
          >
            <StudioIcon name="zoomIn" />
          </button>
          <ToolButton icon="fit" onClick={fit}>
            Fit
          </ToolButton>
          <button onClick={() => setZoom(1)}>100%</button>
          <span className="page-indicator">
            Canvas 1 · {doc.elements.length}/100 elements
          </span>
        </div>
      </section>
      {!preview && (
        <aside
          className={`editor-properties ${mobile === "properties" ? "sheet-open" : ""}`}
          ref={propertiesSheet}
          role={mobile === "properties" ? "dialog" : undefined}
          aria-label={
            panel === "export" ? "Download design" : "Selection properties"
          }
        >
          <button className="sheet-close" onClick={() => setMobile("")}>
            <StudioIcon name="close" /> Close panel
          </button>
          {properties}
        </aside>
      )}
      <input
        ref={upload}
        hidden
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          imageFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        id="studio-replace-image"
        ref={replace}
        hidden
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          imageFile(e.target.files[0], true);
          e.target.value = "";
        }}
      />
      <input
        ref={portable}
        hidden
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          importProject(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </main>
  );
}
