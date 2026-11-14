"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SelectionControls } from "./selection-controls";
import {
  expandSelection,
  editableIds,
  selectElement,
  patchSelection,
  groupSelection,
  ungroupSelection,
  deleteSelection,
  moveSelection,
  transformSelection,
  alignSelection,
  distributeSelection,
  reorderSelection,
  shortcutAction,
} from "@/lib/editor/selection";
import {
  clipboardPayload,
  pasteSelection,
  writeClipboard,
  readClipboard,
} from "@/lib/editor/clipboard";
import { ensureDocumentFonts } from "@/lib/typography/fonts";
import ElementLibrary from "./element-library";
import TextLibrary from "./text-library";
import TemplatePicker from "./template-picker";
import PageStrip from "./page-strip";
import SmartTools from "./smart-tools";
import DrawingTools,{DEFAULT_DRAWING} from './drawing-tools';
import PrecisionTools,{DEFAULT_PRECISION} from './precision-tools';
import FillControls from './fill-controls';
import AnimationTools from './animation-tools';
import {layoutAction} from '@/lib/editor/layout-actions';
import {pageSnapshots,switchPage,addPage,removePage,renamePage,reorderPage,allElements,mapAllElements} from "@/lib/editor/pages";
import {smartResize,generateVariations,applyDesignTheme} from "@/lib/editor/smart-create";
import { insertLibraryElement } from "@/lib/elements/insert";
import DesignCanvas from "./design-canvas";
import { StudioIcon, ToolButton } from "@/components/ui/studio-icon";
import { STUDIO_TOOLS, toolGroup, selectionLabel, connectionLabel } from "./studio-tools";
import { leaveStudio } from "./studio-session";
import { sampleAsset } from "@/lib/templates/assets";
import Image from "next/image";
import {
  PropertiesPanel,
  ExportPanel,
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
import { documentWarnings, browserMeasure, coverCrop } from "@/lib/templates/fitting";
export default function Editor() {
  const { id } = useParams(),
    router = useRouter();
  const [state, setState] = useState(null),
    [selectedIds, setSelectedIds] = useState([]),
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
  const gestureActive = useRef(false),
    autoSaveTimer = useRef(null);
  function gestureChanged(active) {
    gestureActive.current = active;
    clearTimeout(autoSaveTimer.current);
    if (active) return;
    if (latest.current && JSON.stringify(latest.current) !== saved.current)
      autoSaveTimer.current = setTimeout(() => save(latest.current), 800);
  }
  const [cropId, setCropId] = useState(null);
  const [comparePhotoId,setComparePhotoId] = useState(null);
  const [panel, setPanel] = useState("selection");
  const [hasUpgradeBackup, setHasUpgradeBackup] = useState(false);
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
  const selected = selectedIds.length === 1 ? selectedIds[0] : null;
  useEffect(() => {
    if (cropId && (selected !== cropId || !doc?.elements.some(e => e.id === cropId && e.type === "image" && !e.locked))) setCropId(null);
  }, [cropId, selected, doc?.elements]);
  const liveSelection = useMemo(
    () => selectedIds.filter((id) => doc?.elements.some((e) => e.id === id)),
    [selectedIds, doc?.elements],
  );
  const [drawingSettings,setDrawingSettings]=useState(DEFAULT_DRAWING),[precision,setPrecision]=useState(DEFAULT_PRECISION),[motionPreview,setMotionPreview]=useState(0);
  const [multiSelect, setMultiSelect] = useState(false),
    [snapping, setSnapping] = useState(true),
    [clipboardBusy, setClipboardBusy] = useState(false);
  function setSelected(id) {
    setCropId(null);
    setSelectedIds(id ? [id] : []);
  }
  function selectObject(id, additive = false) {
    setCropId(null);
    setSelectedIds((current) =>
      selectElement(latest.current, current, id, additive),
    );
    setPanel("selection");
  }
  function batchChange(changes) {
    try {
      const ids = new Set(editableIds(latest.current, selectedIds));
      return apply(
        validateDocument({
          ...latest.current,
          elements: latest.current.elements.map((e) => {
            const change = changes.find((p) => p.id === e.id);
            return change && ids.has(e.id) ? { ...e, ...change.patch } : e;
          }),
        }),
      );
    } catch (e) {
      setError(e.message);
      return false;
    }
  }
  async function selectionAction(action, value) {
    try {
      const current = latest.current,
        ids = selectedIds;
      if (action === "clear") {
        setSelectedIds([]);
        return;
      }
      if (action === "all") {
        setSelectedIds(
          expandSelection(
            current,
            current.elements
              .filter((e) => !e.locked && !e.hidden)
              .map((e) => e.id),
          ),
        );
        return;
      }
      if (action === "copy" || action === "cut") {
        if (clipboardBusy) return;
        setClipboardBusy(true);
        const targets = action === "cut" ? editableIds(current, ids) : ids;
        await writeClipboard(clipboardPayload(current, targets));
        if (action === "cut") {
          if (JSON.stringify(latest.current) !== JSON.stringify(current))
            throw new Error(
              "Artwork changed while copying. Nothing was cut; copy again.",
            );
          apply(deleteSelection(current, targets));
          setSelectedIds([]);
        }
        setStatus(
          action === "cut"
            ? "Selection cut to local clipboard"
            : "Copied to local clipboard",
        );
        return;
      }
      if (action === "paste" || action === "duplicate") {
        if (clipboardBusy) return;
        setClipboardBusy(true);
        const payload =
          action === "duplicate"
            ? clipboardPayload(current, ids)
            : await readClipboard();
        await verifyAssets(payload.document);
        await ensureDocumentFonts(payload.document);
        const records = await designStore.listPackages(),
          campaignIds = records.map((c) => c.id);
        const result = pasteSelection(
          latest.current,
          payload,
          () => crypto.randomUUID(),
          { campaignIds },
        );
        const sources = await Promise.all(
          [
            ...new Set(
              allElements(result.document).flatMap((e) =>
                e.binding ? [e.binding.campaignId] : [],
              ),
            ),
          ].map((id) => designStore.campaignSnapshot(id)),
        );
        const next = resolveDocument(
          result.document,
          sources.map((s) => s.campaign),
        ).document;
        setCampaigns(sources.map((s) => s.campaign));
        apply(next);
        setSelectedIds(result.ids);
        setPanel("selection");
        return;
      }
      let next;
      if (action === "group")
        next = groupSelection(current, ids, crypto.randomUUID());
      if (action === "ungroup") next = ungroupSelection(current, ids);
      if (action === "delete") next = deleteSelection(current, ids);
      if (action === "move")
        next = moveSelection(current, ids, value.dx, value.dy);
      if (action === "transform")
        next = transformSelection(current, ids, value);
      if (action === "align") next = alignSelection(current, ids, value);
      if (action === "distribute")
        next = distributeSelection(current, ids, value);
      if (action === "forward" || action === "backward")
        next = reorderSelection(current, ids, action === "forward" ? 1 : -1);
      if (["lock", "unlock", "hide", "show"].includes(action))
        next = patchSelection(
          current,
          ids,
          action === "lock" || action === "unlock"
            ? { locked: action === "lock" }
            : { hidden: action === "hide" },
          { includeProtected: true },
        );
      if (next) {
        apply(next);
        if (action === "delete") setSelectedIds([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setClipboardBusy(false);
    }
  }

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
    const group=STUDIO_TOOLS.find(t=>t.id===name);
    setTab(group?(group.tabs.includes(tab)?tab:group.tabs[0]):name);
    setCropId(null);setEditId(null);
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
          await ensureDocumentFonts(document);
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
        setHasUpgradeBackup(!!(record?.legacyV1Backup||record?.legacyPageBackup));
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
          if (snapshot.schemaVersion >= 2)
            designStore
              .load(id)
              .then((record) => {
                if (mounted.current)
                  setHasUpgradeBackup(!!(record?.legacyV1Backup||record?.legacyPageBackup));
              })
              .catch(() => {});
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
    autoSaveTimer.current = setTimeout(() => {
      if (!gestureActive.current) save(latest.current);
    }, 800);
    return () => clearTimeout(autoSaveTimer.current);
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
    if (gestureActive.current || (inFlight.current && !force)) return;
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
      await ensureDocumentFonts(record.document);
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
      return true;
    } catch (e) {
      setError(e.message);
      return false;
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
  function remove() {
    selectionAction("delete");
  }
  function duplicate() {
    selectionAction("duplicate");
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
      if (cropId) {if(e.key==="Escape")setCropId(null);return;}
      const action = shortcutAction(e);
      if (!action || !latest.current || gestureActive.current) return;
      if (preview && action !== "save") return;
      e.preventDefault();
      if (action === "save") save(latest.current);
      else if (action === "undo" || action === "redo")
        actionHistory(action === "undo" ? undo : redo);
      else if (action === "clear") {
        setSelectedIds([]);
        setMobile("");
        setEditId(null);
      } else if (typeof action === "object")
        selectionAction("move", {
          dx:
            action.move === "arrowright"
              ? action.distance
              : action.move === "arrowleft"
                ? -action.distance
                : 0,
          dy:
            action.move === "arrowdown"
              ? action.distance
              : action.move === "arrowup"
                ? -action.distance
                : 0,
        });
      else selectionAction(action);
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
          (box.width - 120) / doc.canvas.width,
          (box.height - 120) / doc.canvas.height,
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
            (b.width - 120) / doc.canvas.width,
            (b.height - 120) / doc.canvas.height,
          ),
        ),
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [doc?.canvas.width, doc?.canvas.height]);
  async function insertCreative(stickerId, frameId) {
    try {
      const asset = stickerId ? await (await import("@/lib/creative/stickers")).stickerAsset(stickerId) : await (await import("@/lib/templates/assets")).sampleAsset("travel");
      const assetId=crypto.randomUUID(), id=crypto.randomUUID(),base=latest.current;
      const e={...makeElement("image",id),width:frameId?420:240,height:frameId?420:240,assetId,crop:coverCrop(asset,1,1),...(frameId?{photoFrame:{id:frameId,color:"#ffffff",border:2}}:{})};
      apply(addElement({...base,schemaVersion:frameId?2:base.schemaVersion,assets:{...base.assets,[assetId]:asset}},e));
      setSelected(id);setPanel("selection");setMobile("properties");
    }catch(e){setError(e.message);}
  }
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
          crop: coverCrop(asset,element.width,element.height),
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
      await ensureDocumentFonts(parsed.document);
      for (const c of parsed.campaigns) {
        for (const a of Object.values(c.assets))
          await verifyAssets({ assets: { photo: a } });
      }
      if (!parsed.campaigns.length) {
        const missing = allElements(parsed.document).filter(
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
          input = mapAllElements(parsed.document,e=>missing.some(m=>m.id===e.id)?{...e,binding:null,localOverride:false}:e);
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
  async function upgradeBackup() {
    try {
      const record = await designStore.load(id);
      if (!(record?.legacyV1Backup||record?.legacyPageBackup))
        throw new Error(
          "No earlier v1 backup exists for this design. A backup is kept when an existing saved v1 design first uses groups or visibility.",
        );
      download(
        new Blob([JSON.stringify(record.legacyPageBackup||record.legacyV1Backup)], {
          type: "application/json",
        }),
        `${doc.name}.before-upgrade.comvexa.json`,
      );
    } catch (e) {
      setError(e.message);
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
  async function exportAllPages(kind) {
    if(cropId){setError("Apply or cancel the crop before exporting.");return;}
    setExporting(true);setError("");
    try{const snapshot=await designStore.exportSnapshot(id,doc,revision.current),{exportPages}=await import("@/lib/editor/multipage-export"),blob=await exportPages(snapshot.document,kind,format,quality,setStatus);download(blob,`${doc.name}.${kind==="pdf"?"pdf":"zip"}`);setStatus("Download ready");}catch(e){setError(e.message);}finally{setExporting(false);}
  }
  async function pageAction(action,pageId,value) {
    if(cropId){setError("Apply or cancel the crop before changing pages.");return;}
    try{const base=latest.current;let next=base;
      if(action==="select"&&!next.pages&&pageId==="page-1")return;
      if(action==="select")next=switchPage(next,pageId);
      if(action==="add")next=addPage(next,crypto.randomUUID());
      if(action==="duplicate")next=addPage(switchPage(next,pageId),crypto.randomUUID(),{duplicate:true,name:pageSnapshots(next).find(p=>p.id===pageId).name.slice(0,75)+" copy"});
      if(action==="delete")next=removePage(next,pageId);
      if(action==="rename")next=renamePage(next,pageId,value);
      if(action==="reorder")next=reorderPage(next,pageId,value);
      await ensureDocumentFonts(next);if(latest.current!==base)throw Error("The page changed while loading. Try again.");if(apply(next)){setSelectedIds([]);setEditId(null);setComparePhotoId(null);setMobile("");}
    }catch(e){setError(e.message);}
  }
  async function resizeSmart(size,copy) {
    try{const result=smartResize(latest.current,size.width,size.height);
      if(copy){const nextId=crypto.randomUUID();await designStore.save(nextId,{...result.document,name:(result.document.name+" resized").slice(0,80)},0);await navigateSafely(`/editor/${nextId}`);}else{apply(result.document);setDimensions(size);}
      if(result.warnings.length)setError(result.warnings.join(" "));
    }catch(e){setError(e.message);}
  }
  async function smartStyle(theme,mode){try{const next=applyDesignTheme(latest.current,theme,{colors:mode!=="fonts",fonts:mode!=="colors"});await ensureDocumentFonts(next);apply(next);}catch(e){setError(e.message);}}
  async function makeVariations(){try{const next=generateVariations(latest.current);await ensureDocumentFonts(next);if(apply(next)){setSelectedIds([]);setMobile("");setError("Six new layouts added. Review text fitting and object placement.");}}catch(e){setError(e.message);}}
  async function exportImage() {
    if (cropId) {setError("Apply or cancel the crop before exporting.");return;}
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
    await navigateSafely("/dashboard");
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
      <h2>{tab==="Resize"?"Resize & create":tab==='Precision'?'Position & guides':tab}</h2>
      {(toolGroup(tab)?.tabs.length||0)>1&&<div className="tool-subnav" role="group" aria-label={`${toolGroup(tab).id} tools`}>{toolGroup(tab).tabs.map(id=><button key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setCropId(null);setEditId(null);}}>{id==='Resize'?'Resize & styles':id==='Precision'?'Precision':id}</button>)}</div>}
      {tab==='Drawing'&&<DrawingTools settings={drawingSettings} onChange={setDrawingSettings} onDone={()=>{setTab('Elements');setMobile('');}}/>}
      {tab==='Precision'&&<><PrecisionTools value={precision} onChange={setPrecision} doc={doc}/><div className="layout-shortcuts">{[['center','Center Everything'],['align','Align Selection'],['distribute','Distribute Evenly'],['tidy','Tidy Layout'],['fit','Fit to Page']].map(([action,label])=><button key={action} onClick={()=>{try{apply(layoutAction(doc,action==='center'?[]:selectedIds,action,precision.margin));}catch(e){setError(e.message);}}}>{label}</button>)}</div><p className="editor-small">Layout actions use the selection, or all unlocked objects. Tidy stacks groups vertically with equal gaps; Fit preserves proportions.</p></>}
      {tab==='Animate'&&<AnimationTools doc={doc} element={element} onPatch={patch=>change(element.id,patch)} onCanvas={patch=>apply({...doc,canvas:{...doc.canvas,...patch}})} onPlay={()=>{setTab('Animate');setEditId(null);setCropId(null);setMobile('');setMotionPreview(n=>n+1);}}/>}
      {tab === "Text" && <TextLibrary onAdd={kind=>{
        try {
          const e=makeElement("text",crypto.randomUUID());
          Object.assign(e,kind==="heading"?{text:"Add a heading",fontSize:76,fontWeight:"bold"}:kind==="subheading"?{text:"Add a subheading",fontSize:42,fontWeight:"normal"}:{text:"Your paragraph text",fontSize:26,fontWeight:"normal",lineHeight:1.5});
          e.width=Math.min(600,doc.canvas.width*.85);e.height=Math.min(200,doc.canvas.height*.5);e.x=(doc.canvas.width-e.width)/2;e.y=(doc.canvas.height-e.height)/2;
          if(apply(addElement(latest.current,e))){setSelected(e.id);setPanel("selection");setMobile("properties");}
        }catch(e){setError(e.message);}
      }} onInsert={async designId=>{
        try {
          const {insertTextDesign}=await import("@/lib/typography/designs");
          const base=latest.current,result=insertTextDesign(base,designId,()=>crypto.randomUUID());
          await ensureDocumentFonts(result.document);
          // Preserve edits from another source while fonts were loading.
          const next=latest.current===base?result:insertTextDesign(latest.current,designId,()=>crypto.randomUUID());
          if(apply(next.document)){setSelectedIds(next.ids);setPanel("selection");setMobile("");}
        }catch(e){setError(e.message);}
      }}/>}
      {tab === "Templates" && <TemplatePicker onBrowse={browseTemplates} onUse={async(templateId,multi)=>{
        try {
          if(cropId){setError("Apply or cancel the crop before opening a template.");return;}
          let document;
          if(multi){const {generateMultiPageTemplate}=await import("@/lib/templates/multipage");document=await generateMultiPageTemplate(templateId);}
          else{const {createTemplateDocument}=await import("@/lib/templates/open-template");document=await createTemplateDocument(templateId);}
          const nextId=crypto.randomUUID();await designStore.save(nextId,document,0);const {rememberTemplate}=await import("@/lib/templates/open-template");rememberTemplate(templateId);await navigateSafely(`/editor/${nextId}`);
        }catch(e){setError(e.message);}
      }}/>}
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
      {tab === "Elements" && <ElementLibrary onSticker={id=>insertCreative(id,null)} onFrame={id=>insertCreative(null,id)} onInsert={(kind, fill) => {
        try {
          const id = crypto.randomUUID();
          apply(insertLibraryElement(latest.current, kind, id, fill));
          setSelected(id);
          setPanel("selection");
          setMobile("properties");
        } catch(e) { setError(e.message); }
      }} />}
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
      {tab === "Resize" && <SmartTools key={doc.activePageId||"single"} doc={doc} onResize={resizeSmart} onVariations={makeVariations} onTheme={smartStyle} onArrange={mode=>{try{const ids=selectedIds.length?selectedIds:doc.elements.filter(e=>!e.locked&&!e.hidden).map(e=>e.id);apply(layoutAction(doc,ids,mode,precision.margin));}catch(e){setError(e.message);}}}/>}
      {tab === "Backgrounds" && <>
        <label className="editor-field">Canvas color<input type="color" value={doc.canvas.background} onChange={e=>apply({...doc,canvas:{...doc.canvas,background:e.target.value,fillEffect:null,transparent:false}})}/></label>
        <label className="editor-check"><input type="checkbox" checked={!!doc.canvas.transparent} onChange={e=>apply({...doc,canvas:{...doc.canvas,transparent:e.target.checked}})}/>Transparent background</label>
        <FillControls value={doc.canvas.fillEffect} onChange={fillEffect=>apply({...doc,canvas:{...doc.canvas,fillEffect,transparent:false}})}/>
        <p className="editor-small">PNG preserves transparency. JPG and PDF use a white backdrop. For a photo background, add a photo, fit it to the page and send it behind other layers.</p>
      </>}
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
              (selectionLabel(e) + " " + e.type + " " + (e.text || ""))
                .toLowerCase()
                .includes(layerSearch.toLowerCase()),
            )
            .map((e) => (
              <div
                className={`studio-layer ${liveSelection.includes(e.id) ? "is-selected" : ""}`}
                key={e.id}
              >
                {e.groupId && (
                  <span className="layer-group-tag">
                    <StudioIcon name="group" size={12} /> Group{" "}
                    {[
                      ...new Set(
                        doc.elements.flatMap((n) =>
                          n.groupId ? [n.groupId] : [],
                        ),
                      ),
                    ].indexOf(e.groupId) + 1}{" "}
                    ·{" "}
                    {doc.elements.filter((n) => n.groupId === e.groupId).length}
                  </span>
                )}
                <input
                  type="checkbox"
                  aria-label={`Select ${e.type === "text" ? e.text.slice(0, 28) || "empty text" : selectionLabel(e)} layer`}
                  checked={liveSelection.includes(e.id)}
                  onChange={() => selectObject(e.id, true)}
                />
                <button
                  aria-pressed={liveSelection.includes(e.id)}
                  className="layer-item"
                  onClick={(event) => {
                    selectObject(e.id, event.shiftKey || multiSelect);
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
                    <small>
                      {e.hidden ? "Hidden · " : ""}
                      {connectionLabel(e)}
                    </small>
                  </span>
                </button>
                <button
                  title={e.locked ? "Unlock layer" : "Lock layer"}
                  aria-label={`${e.locked ? "Unlock" : "Lock"} ${e.type === "text" ? e.text.slice(0, 28) || "empty text" : selectionLabel(e)} layer`}
                  onClick={() =>
                    apply(
                      patchSelection(
                        doc,
                        [e.id],
                        { locked: !e.locked },
                        { includeProtected: true },
                      ),
                    )
                  }
                >
                  <StudioIcon name={e.locked ? "lock" : "unlock"} />
                </button>
                <button
                  title={e.hidden ? "Show layer" : "Hide layer"}
                  aria-label={`${e.hidden ? "Show" : "Hide"} ${e.type === "text" ? e.text.slice(0, 28) || "empty text" : selectionLabel(e)} layer`}
                  onClick={() =>
                    apply(
                      patchSelection(
                        doc,
                        [e.id],
                        { hidden: !e.hidden },
                        { includeProtected: true },
                      ),
                    )
                  }
                >
                  <StudioIcon name={e.hidden ? "hide" : "eye"} />
                </button>
              </div>
            ))}
        </>
      )}
      <details className="studio-details"><summary>Keyboard shortcuts</summary>
      <p className="editor-small">
        Shortcuts: ⌘/Ctrl A select all · C/X/V copy/cut/paste · G group · Shift
        G ungroup · D duplicate · Z undo · Shift Z redo · S save. Arrows move;
        Shift arrows move 10 px. Shift-click adds to selection. Clipboard stays
        in this browser.
      </p></details>
    </>
  );
  const selectionProps = {
    count: liveSelection.length,
    unitCount: new Set(
      doc?.elements
        .filter((e) => editableIds(doc, liveSelection).includes(e.id))
        .map((e) => e.groupId || e.id),
    ).size,
    editableCount: doc ? editableIds(doc, liveSelection).length : 0,
    hasGroup: doc?.elements.some(
      (e) => liveSelection.includes(e.id) && e.groupId,
    ),
    multiSelect,
    setMultiSelect,
    snapping,
    setSnapping,
    act: selectionAction,
  };
  const properties =
    panel === "selection" && liveSelection.length > 1 ? (
      <SelectionControls {...selectionProps} />
    ) : panel === "export" ? (
      <ExportPanel
        exportAllPages={exportAllPages}
        doc={doc}
        format={format}
        setFormat={setFormat}
        quality={quality}
        setQuality={setQuality}
        exporting={exporting}
        exportImage={exportImage}
        projectFile={projectFile}
        portable={portable}
        upgradeBackup={hasUpgradeBackup ? upgradeBackup : null}
      />
    ) : (
      <PropertiesPanel
        element={element}
        onPaste={() => selectionAction("paste")}
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
        onCompare={active=>setComparePhotoId(active?element.id:null)}
        onCrop={()=>{setCropId(element.id);setMobile("");setEditId(null);}}
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
          href="/dashboard"
          onClick={goBack}
          label="Save and return to Home"
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
            aria-pressed={toolGroup(tab)?.id === tool.id && !preview}
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
              <strong>
                {liveSelection.length > 1
                  ? `${liveSelection.length} selected`
                  : selectionLabel(element)}
              </strong>

            </div>
            <div>
              {element ? (
                <>
                  <ToolButton icon="edit" onClick={() => openPanel()}>
                    Edit
                  </ToolButton>
                  {element.type === "image" && <ToolButton icon="crop" disabled={element.locked} onClick={()=>{setCropId(element.id);setMobile("");}}>Crop</ToolButton>}
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
                  {liveSelection.length > 1 ? (
                    <button onClick={() => openPanel()}>Edit selection</button>
                  ) : (
                    "Choose a tool or select something to begin"
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {!preview && <div className="precision-bar"><SelectionControls {...selectionProps} compact/><button className="guides-toggle" aria-pressed={precision.show} onClick={()=>setPrecision(v=>({...v,show:!v.show}))}>Guides {precision.show?'on':'off'}</button>{tab==='Drawing'&&<button className="guides-toggle" onClick={()=>setMobile('')}>Draw on canvas</button>}</div>}
        <div className="editor-viewport" ref={viewport}>
          <div className="canvas-centering">
            <DesignCanvas
              doc={doc}
              drawing={tab==='Drawing'&&!preview?drawingSettings:null}
              precision={precision}
              motionPreview={motionPreview}
              onStroke={stroke=>{if(apply(addElement({...latest.current,schemaVersion:latest.current.pages?3:2},stroke)))setSelectedIds([stroke.id]);}}
              onErase={ids=>apply(deleteSelection(latest.current,ids))}
              comparisonId={comparePhotoId===selected?comparePhotoId:null}
              selectedIds={liveSelection}
              select={selectObject}
              selectIds={setSelectedIds}
              multiSelect={multiSelect}
              snapping={snapping}
              patchMany={batchChange}
              onGestureChange={gestureChanged}
              patch={change}
              zoom={zoom}
              preview={preview}
              editId={editId}
              setEditId={setEditId}
              aspectLocked={aspect}
              cropId={cropId===selected?cropId:null}
              onCropCancel={()=>setCropId(null)}
              onCropApply={crop=>{change(cropId,{crop});setCropId(null);}}
            />
          </div>
        </div>
        {!preview&&<PageStrip projectId={id} doc={doc} onAction={pageAction} disabled={exporting||!!cropId}/>}
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
            Page {doc.pages?doc.pages.findIndex(p=>p.id===doc.activePageId)+1:1} of {doc.pages?.length||1} · {doc.elements.length}/100 elements
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
