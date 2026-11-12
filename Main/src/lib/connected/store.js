import { openDesignDB } from "../editor/database.js";
import { validateDocument } from "../editor/document.js";
import {
  normalizeCampaign,
  resolveDocument,
  planUpdate,
  portableEnvelope,
  parsePortable,
} from "./model.js";
export function announceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("comvexa-design-change"));
  if (typeof BroadcastChannel !== "undefined") {
    const c = new BroadcastChannel("comvexa-designs");
    c.postMessage("changed");
    c.close();
  }
}
export function subscribeChanges(callback) {
  if (typeof window === "undefined") return () => {};
  const c =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("comvexa-designs")
      : null;
  if (c) c.onmessage = callback;
  window.addEventListener("comvexa-design-change", callback);
  window.addEventListener("focus", callback);
  const timer = setInterval(callback, 3000);
  return () => {
    c?.close();
    clearInterval(timer);
    window.removeEventListener("comvexa-design-change", callback);
    window.removeEventListener("focus", callback);
  };
}
function fail(t, ref, message) {
  ref.error = message instanceof Error ? message : new Error(message);
  t.abort();
}
function all(t, done) {
  const r = t.objectStore("designs").getAll(),
    p = t.objectStore("packages").getAll();
  let records, campaigns;
  const ready = () => {
    if (records && campaigns) done(records, campaigns);
  };
  r.onsuccess = () => {
    records = r.result;
    ready();
  };
  p.onsuccess = () => {
    campaigns = p.result;
    ready();
  };
}
function campaignsFor(doc, records, raw) {
  const ids = new Set(
    doc.elements.flatMap((e) => (e.binding ? [e.binding.campaignId] : [])),
  );
  if (doc.provenance?.campaignId) ids.add(doc.provenance.campaignId);
  return raw
    .filter((c) => ids.has(c.id))
    .map((c) =>
      normalizeCampaign(
        c,
        records
          .filter(
            (r) =>
              r.document.elements.some((e) => e.binding?.campaignId === c.id) ||
              r.document.provenance?.campaignId === c.id,
          )
          .map((r) => r.document),
      ),
    );
}
async function transaction(mode, operation) {
  const db = await openDesignDB();
  try {
    const value = await new Promise((resolve, reject) => {
      const t = db.transaction(["designs", "packages"], mode),
        ref = {};
      t.oncomplete = () => resolve(ref.value);
      t.onabort = t.onerror = () =>
        reject(
          ref.error ||
            new Error(
              "Local transaction failed. Storage may be full, disabled or interrupted. Previous saved records were preserved.",
            ),
        );
      all(t, (records, raw) => {
        try {
          operation(t, ref, records, raw);
        } catch (e) {
          fail(
            t,
            ref,
            ["QuotaExceededError", "DataCloneError"].includes(e.name)
              ? new Error(
                  "Local save failed. Storage may be full or disabled. Previous records were preserved.",
                )
              : e,
          );
        }
      });
    });
    if (mode === "readwrite") announceChange();
    return value;
  } finally {
    db.close();
  }
}
export const connectedStore = {
  async loadConnected(id) {
    return transaction("readonly", (_t, ref, records, raw) => {
      const record = records.find((r) => r.id === id);
      if (!record) {
        ref.value = null;
        return;
      }
      const campaigns = campaignsFor(record.document, records, raw),
        resolved = resolveDocument(record.document, campaigns, {
          strict: false,
        });
      ref.value = {
        ...record,
        document: resolved.document,
        campaigns,
        connectionWarnings: resolved.warnings,
      };
    });
  },
  async campaignSnapshot(id) {
    return transaction("readonly", (_t, ref, records, raw) => {
      const stored = raw.find((c) => c.id === id);
      if (!stored) throw new Error("Campaign not found in this browser.");
      const associated = records.filter(
        (r) =>
          r.document.provenance?.campaignId === id ||
          r.document.elements.some((e) => e.binding?.campaignId === id),
      );
      const campaign = normalizeCampaign(
        stored,
        associated.map((r) => r.document),
      );
      ref.value = {
        campaign,
        records: associated.map((r) => ({
          ...r,
          document: resolveDocument(r.document, [campaign], { strict: false })
            .document,
        })),
      };
    });
  },
  async saveConnected(id, document, expectedRevision) {
    document = validateDocument(document);
    return transaction("readwrite", (t, ref, records, raw) => {
      const current = records.find((r) => r.id === id);
      if ((current?.revision || 0) !== expectedRevision)
        throw new Error(
          "This design changed in another tab or campaign. Download your project file, then reload to avoid overwriting it.",
        );
      const campaigns = campaignsFor(document, records, raw);
      if (
        new Set(
          document.elements.flatMap((e) =>
            e.binding ? [e.binding.campaignId] : [],
          ),
        ).size > 1
      )
        throw new Error("A design can connect to one campaign.");
      for(const campaign of campaigns)if(!raw.find(c=>c.id===campaign.id)?.connectedVersion)t.objectStore('packages').put(campaign);
      const resolved = resolveDocument(document, campaigns).document;
      const revision = expectedRevision + 1;
      t.objectStore("designs").put({
        id,
        document: resolved,
        revision,
        updatedAt: new Date().toISOString(),
      });
      ref.value = revision;
    });
  },
  async updateCampaign(
    id,
    next,
    expectedRevision,
    { detachFields = [], expectedDesignRevisions } = {},
  ) {
    return transaction("readwrite", (t, ref, records, raw) => {
      const stored = raw.find((c) => c.id === id);
      if (!stored) throw new Error("Campaign not found.");
      const associated = records.filter(
        (r) =>
          r.document.provenance?.campaignId === id ||
          r.document.elements.some((e) => e.binding?.campaignId === id),
      );
      const current = normalizeCampaign(
        stored,
        associated.map((r) => r.document),
      );
      if (current.revision !== expectedRevision)
        throw new Error(
          "Campaign changed in another tab. Your draft was kept. Reload the saved campaign before retrying.",
        );
      if (
        expectedDesignRevisions &&
        associated.some((r) => expectedDesignRevisions[r.id] !== r.revision)
      )
        throw new Error(
          "A design changed while you reviewed the campaign. Refresh the preview before saving.",
        );
      const plan = planUpdate(current, next, associated, { detachFields });
      const now = new Date().toISOString();
      for (const r of plan.records)
        t.objectStore("designs").put({
          ...r,
          revision: r.revision + 1,
          updatedAt: now,
        });
      t.objectStore("packages").put({
        ...plan.campaign,
        designIds: plan.records.map((r) => r.id),
        updatedAt: now,
      });
      ref.value = {
        campaign: plan.campaign,
        records: plan.records.map((r) => ({
          ...r,
          revision: r.revision + 1,
          updatedAt: now,
        })),
      };
    });
  },
  async exportSnapshot(id, document, expectedRevision) {
    return transaction("readonly", (_t, ref, records, raw) => {
      const stored = records.find((r) => r.id === id);
      if ((stored?.revision || 0) !== expectedRevision)
        throw new Error(
          "The saved design changed. Reload it before exporting to get a consistent campaign revision.",
        );
      const campaigns = campaignsFor(document, records, raw);
      ref.value = { ...resolveDocument(document, campaigns), campaigns };
    });
  },
  async portable(document) {
    return transaction("readonly", (_t, ref, records, raw) => {
      ref.value = portableEnvelope(
        document,
        campaignsFor(document, records, raw),
      );
    });
  },
  async importConnected(
    id,
    input,
    expectedRevision,
    idFactory = () => crypto.randomUUID(),
  ) {
    const parsed = parsePortable(input);
    return transaction("readwrite", (t, ref, records, raw) => {
      const current = records.find((r) => r.id === id);
      if ((current?.revision || 0) !== expectedRevision)
        throw new Error(
          "The design changed before import. Reload before replacing it.",
        );
      let doc = parsed.document;
      const mapping = new Map(parsed.campaigns.map((c) => [c.id, idFactory()]));
      const campaigns = parsed.campaigns.map((c) =>
        normalizeCampaign(
          {
            ...c,
            id: mapping.get(c.id),
            revision: 0,
            designIds: [id],
            createdAt: new Date().toISOString(),
          },
          [doc],
        ),
      );
      for (const c of campaigns)
        if (raw.some((old) => old.id === c.id))
          throw new Error("Import identifier collision. Retry the import.");
      doc = {
        ...doc,
        elements: doc.elements.map((e) =>
          e.binding
            ? {
                ...e,
                binding: {
                  ...e.binding,
                  campaignId:
                    mapping.get(e.binding.campaignId) || e.binding.campaignId,
                },
              }
            : e,
        ),
        ...(doc.provenance
          ? {
              provenance: {
                ...doc.provenance,
                campaignId:
                  mapping.get(doc.provenance.campaignId) ||
                  doc.provenance.campaignId,
              },
            }
          : {}),
      };
      const sources = [...campaigns, ...campaignsFor(doc, records, raw)];
      doc = resolveDocument(doc, sources).document;
      for (const c of campaigns) t.objectStore("packages").add(c);
      const revision = expectedRevision + 1;
      t.objectStore("designs").put({
        id,
        document: doc,
        revision,
        updatedAt: new Date().toISOString(),
      });
      ref.value = { document: doc, campaigns: sources, revision };
    });
  },
  async addCampaignDesign(id, document, expectedRevision, designId) {
    document = validateDocument(document);
    return transaction("readwrite", (t, ref, records, raw) => {
      const stored = raw.find((c) => c.id === id);
      if (!stored) throw new Error("Campaign not found.");
      const campaign = normalizeCampaign(
        stored,
        records.map((r) => r.document),
      );
      if (campaign.revision !== expectedRevision)
        throw new Error("Campaign changed. Refresh before adding a design.");
      if (records.some((r) => r.id === designId))
        throw new Error("Design identifier exists.");
      const doc = resolveDocument(document, [campaign]).document;
      t.objectStore("designs").add({
        id: designId,
        document: doc,
        revision: 1,
        updatedAt: new Date().toISOString(),
      });
      t.objectStore("packages").put({
        ...campaign,
        designIds: [...campaign.designIds, designId],
        revision: campaign.revision + 1,
      });
      ref.value = designId;
    });
  },
};
