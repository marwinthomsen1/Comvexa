import {accountDatabase} from "../cloud/account-scope.js";
import {pageDocuments,allElements} from "./pages.js";
import { validateDocument } from "./document.js";
import { expandSelection } from "./selection.js";
const LIMIT = 24 * 1024 * 1024;
export function clipboardPayload(doc, ids) {
  const wanted = new Set(expandSelection(doc, ids));
  const document = validateDocument({
    ...pageDocuments(doc)[doc.pages?doc.pages.findIndex(p=>p.id===doc.activePageId):0],
    elements: doc.elements.filter((e) => wanted.has(e.id)),
  });
  if (!document.elements.length) throw new Error("Select something to copy.");
  return { kind: "comvexa-selection", version: 1, document };
}
export function parseClipboard(value) {
  if (typeof value === "string") {
    if (value.length > LIMIT)
      throw new Error("Clipboard content is too large.");
    value = JSON.parse(value);
  }
  if (!value || value.kind !== "comvexa-selection" || value.version !== 1)
    throw new Error("Only Comvexa selections can be pasted here.");
  return validateDocument(value.document);
}
export function pasteSelection(
  doc,
  payload,
  idFactory,
  { offset = 24, campaignIds = [] } = {},
) {
  const source = parseClipboard(payload);
  const sourceCampaigns = new Set(
    source.elements.flatMap((e) => (e.binding ? [e.binding.campaignId] : [])),
  );
  const currentCampaigns = new Set(
    allElements(doc).flatMap((e) => (e.binding ? [e.binding.campaignId] : [])),
  );
  if (doc.provenance?.campaignId)
    currentCampaigns.add(doc.provenance.campaignId);
  if (new Set([...sourceCampaigns, ...currentCampaigns]).size > 1)
    throw new Error(
      "This design already uses another campaign. Paste into a blank design or the same campaign to keep connections.",
    );
  for (const id of sourceCampaigns)
    if (!campaignIds.includes(id))
      throw new Error(
        "The source campaign is unavailable. Reopen the original connected project before copying.",
      );
  const assets = { ...doc.assets },
    assetIds = new Map(),
    groups = new Map();
  for (const [id, asset] of Object.entries(source.assets)) {
    const existing = Object.keys(assets).find(
      (key) => assets[key].src === asset.src,
    );
    const next = existing || idFactory();
    assetIds.set(id, next);
    assets[next] = asset;
  }
  const elements = source.elements.map((e) => {
    if (e.groupId && !groups.has(e.groupId)) groups.set(e.groupId, idFactory());
    return {
      ...e,
      id: idFactory(),
      x: e.x + offset,
      y: e.y + offset,
      locked: false,
      ...(e.groupId ? { groupId: groups.get(e.groupId) } : {}),
      ...(e.assetId ? { assetId: assetIds.get(e.assetId) } : {}),
      ...(e.photoOriginalAssetId?{photoOriginalAssetId:assetIds.get(e.photoOriginalAssetId)}:{}),
      ...(e.photoCutoutAssetId?{photoCutoutAssetId:assetIds.get(e.photoCutoutAssetId)}:{}),
    };
  });
  const document = validateDocument({
    ...doc,
    schemaVersion: Math.max(doc.schemaVersion, source.schemaVersion),
    assets,
    elements: [...doc.elements, ...elements],
  });
  return { document, ids: elements.map((e) => e.id) };
}
// Browser-local clipboard shared across same-origin design tabs. No system clipboard permission.
async function db() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(accountDatabase("comvexa-clipboard-v1"), 1);
    r.onupgradeneeded = () => r.result.createObjectStore("clipboard");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(new Error("Local clipboard is unavailable."));
  });
}
export async function writeClipboard(value) {
  parseClipboard(value);
  const database = await db();
  try {
    await new Promise((resolve, reject) => {
      const t = database.transaction("clipboard", "readwrite");
      t.objectStore("clipboard").put(value, "selection");
      t.oncomplete = resolve;
      t.onabort = t.onerror = () =>
        reject(
          new Error(
            "Copy failed: local clipboard storage is full or unavailable.",
          ),
        );
    });
  } finally {
    database.close();
  }
}
export async function readClipboard() {
  const database = await db();
  try {
    return await new Promise((resolve, reject) => {
      const t = database.transaction("clipboard", "readonly"),
        r = t.objectStore("clipboard").get("selection");
      r.onsuccess = () => {
        if (!r.result) reject(new Error("Copy a Comvexa selection first."));
        else resolve(r.result);
      };
      r.onerror = () =>
        reject(new Error("Could not read the local clipboard."));
    });
  } finally {
    database.close();
  }
}
