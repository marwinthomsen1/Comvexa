"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { designStore } from "@/lib/editor/store";
import { subscribeChanges } from "@/lib/connected/store";
import {
  normalizeCampaign,
  planUpdate,
  resolveDocument,
} from "@/lib/connected/model";
import { DocumentPreview } from "@/features/templates/document-preview";
import { RATIOS, getFamily } from "@/lib/templates/catalog";
import { generateDesign } from "@/lib/templates/generate";
import { documentWarnings, browserMeasure } from "@/lib/templates/fitting";
import { readImage, verifyAssets } from "@/lib/editor/images";
import "./connected.css";
export default function CampaignWorkspace() {
  const { id } = useParams();
  const [mobileView,setMobileView]=useState("fields");
  const [snapshot, setSnapshot] = useState(null),
    [draft, setDraft] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [detached, setDetached] = useState([]),
    [ratio, setRatio] = useState("square"),
    [past, setPast] = useState([]),
    [future, setFuture] = useState([]);
  const dirtyRef = useRef(false),
    upload = useRef(null),
    draftUpload = useRef(null),
    imageField = useRef(null),
    previewGrid = useRef(null);
  const dirty =
    !!snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.campaign);
  dirtyRef.current = dirty;
  const reload = useCallback(
    async (force = false) => {
      try {
        const next = await designStore.campaignSnapshot(id);
        if (dirtyRef.current && !force) {
          if (snapshot && next.campaign.revision !== snapshot.campaign.revision)
            setNotice(
              "Saved campaign changed elsewhere. Your draft is kept. Reload saved values or save a draft backup before continuing.",
            );
          return;
        }
        setSnapshot(next);
        setDraft(next.campaign);
        setDetached([]);
        setPast([]);
        setFuture([]);
        setNotice("Saved in this browser");
      } catch (e) {
        setError(e.message);
      }
    },
    [id, snapshot],
  );
  useEffect(() => {
    designStore
      .campaignSnapshot(id)
      .then((next) => {
        setSnapshot(next);
        setDraft(next.campaign);
        setNotice("Saved in this browser");
      })
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(
    () =>
      subscribeChanges(() => {
        if (!busy) reload();
      }),
    [reload, busy],
  );
  useEffect(() => {
    const leave = (e) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previewGrid.current?.animate([{ opacity: 0.82 }, { opacity: 1 }], {
        duration: 180,
        easing: "ease-out",
      });
    }
  }, [draft]);
  function edit(next) {
    setPast((p) => [...p, draft].slice(-30));
    setFuture([]);
    setDraft(next);
    setError("");
    setNotice(
      "Unsaved campaign preview — linked artwork has not been committed yet.",
    );
  }
  function field(id, patch) {
    edit({
      ...draft,
      sharedFields: draft.sharedFields.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      ),
    });
  }
  const plan = useMemo(() => {
    if (!snapshot || !draft) return null;
    try {
      return {
        ...planUpdate(snapshot.campaign, draft, snapshot.records, {
          detachFields: detached,
        }),
        error: "",
      };
    } catch (e) {
      return { error: e.message, records: [] };
    }
  }, [snapshot, draft, detached]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      if (plan.error) throw new Error(plan.error);
      for (const r of plan.records) await verifyAssets(r.document);
      const result = await designStore.updateCampaign(
        id,
        draft,
        snapshot.campaign.revision,
        {
          detachFields: detached,
          expectedDesignRevisions: Object.fromEntries(
            snapshot.records.map((r) => [r.id, r.revision]),
          ),
        },
      );
      setSnapshot(result);
      setDraft(result.campaign);
      setPast([]);
      setFuture([]);
      setDetached([]);
      setNotice(
        `Saved revision ${result.campaign.revision}. All connected designs updated together.`,
      );
    } catch (e) {
      setError(e.message);
      setNotice(
        "Save failed — your draft is still here. No partial update was committed.",
      );
    } finally {
      setBusy(false);
    }
  }
  function remove(f) {
    const count = snapshot.records.reduce(
      (n, r) =>
        n +
        r.document.elements.filter(
          (e) => e.binding?.campaignId === id && e.binding.fieldId === f.id,
        ).length,
      0,
    );
    if (
      count &&
      !window.confirm(
        `Remove “${f.label}” and detach ${count} connected element(s)? Their current content and overrides will be kept as independent content.`,
      )
    )
      return;
    setDetached((old) => [...old, f.id]);
    edit({
      ...draft,
      sharedFields: draft.sharedFields.filter((n) => n.id !== f.id),
    });
  }
  async function photo(file) {
    setBusy(true);
    try {
      const asset = await readImage(file),
        assetId = crypto.randomUUID();
      edit({
        ...draft,
        assets: { ...draft.assets, [assetId]: asset },
        sharedFields: draft.sharedFields.map((f) =>
          f.id === imageField.current ? { ...f, value: assetId } : f,
        ),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function addDesign() {
    setBusy(true);
    try {
      if (dirty)
        throw new Error(
          "Save the campaign changes before creating another design.",
        );
      const f = getFamily(draft.fields.styleId),
        image = draft.sharedFields.find((f) => f.type === "image"),
        asset = draft.assets[image?.value];
      if (!asset)
        throw new Error(
          "Add a campaign photo before generating another design.",
        );
      const input = {
        ...draft.fields,
        name:
          draft.sharedFields.find((f) => f.id === "name")?.value || draft.name,
        styleId: f.id,
      };
      const result = generateDesign({
        templateId: `${f.id}-${ratio}`,
        campaignId: id,
        fields: input,
        asset,
        assetId: image.value,
        measure: browserMeasure,
      });
      if (result.warnings.length) throw new Error(result.warnings.join(" "));
      for (const e of result.document.elements)
        if (e.type === "image") e.binding.fieldId = image.id;
      const doc = resolveDocument(result.document, [draft]).document;
      await designStore.addCampaignDesign(
        id,
        doc,
        draft.revision,
        crypto.randomUUID(),
      );
      await reload(true);
      setNotice("Additional connected design created.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function importDraft(file) {
    try {
      if (!file || file.size > 24 * 1024 * 1024)
        throw new Error("Draft backup exceeds 24 MB.");
      const input = JSON.parse(await file.text());
      if (
        input.kind !== "comvexa-campaign-draft" ||
        input.version !== 1 ||
        input.campaign?.id !== id
      )
        throw new Error("Choose a draft backup for this campaign.");
      const value = normalizeCampaign(
        { ...input.campaign, revision: snapshot.campaign.revision },
        snapshot.records.map((r) => r.document),
      );
      for (const asset of Object.values(value.assets))
        await verifyAssets({ assets: { photo: asset } });
      const removed = snapshot.campaign.sharedFields
        .filter((f) => !value.sharedFields.some((n) => n.id === f.id))
        .map((f) => f.id);
      if (
        !window.confirm(
          "Load this draft for review? Removed fields will detach from designs only after you save the shared changes.",
        )
      )
        return;
      setDetached(removed);
      edit(value);
    } catch (e) {
      setError(e.message);
    }
  }
  async function backup() {
    try {
      const { download } = await import("@/lib/editor/export");
      download(
        new Blob(
          [
            JSON.stringify({
              kind: "comvexa-campaign-draft",
              version: 1,
              campaign: draft,
            }),
          ],
          { type: "application/json" },
        ),
        `${draft.name}.campaign-draft.json`,
      );
    } catch (e) {
      setError(e.message);
    }
  }
  if (!draft)
    return (
      <section>
        <h1>Connected campaign</h1>
        <p role={error ? "alert" : "status"}>{error || "Opening campaign…"}</p>
        <Link href="/dashboard/campaigns">Back to campaigns</Link>
      </section>
    );
  return (
    <section className="connected-workspace">
      <Link className="text-link" href="/dashboard/campaigns">
        ← My campaigns
      </Link>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">CREATE ONCE. UPDATE EVERYWHERE.</span>
          <h1>{draft.name}</h1>
          <p>
            Edit shared information and watch the connected previews follow.
            Layouts stay in place.
          </p>
        </div>
        <button
          className="button"
          disabled={busy || !dirty || !!plan?.error}
          onClick={save}
        >
          {busy ? "Saving…" : "Save shared changes"}
        </button>
      </div>
      <p role="status" className="connected-save-status">
        {notice} · Revision {snapshot.campaign.revision} · Browser-local, no
        cloud backup
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {plan?.error && (
        <p className="form-error" role="alert">
          {plan.error}
        </p>
      )}
      <nav className="connected-mobile-tabs" aria-label="Campaign view"><button aria-pressed={mobileView==="fields"} onClick={()=>setMobileView("fields")}>Shared information</button><button aria-pressed={mobileView==="designs"} onClick={()=>setMobileView("designs")}>Design previews</button></nav>
      <div className={`connected-layout mobile-${mobileView}`}>
        <section className="shared-fields">
          <div className="shared-fields-heading">
            <h2>Shared information</h2>
            <div>
              <button
                disabled={!past.length || busy}
                onClick={() => {
                  setFuture((f) => [draft, ...f]);
                  setDraft(past.at(-1));
                  setPast((p) => p.slice(0, -1));
                }}
              >
                Undo
              </button>
              <button
                disabled={!future.length || busy}
                onClick={() => {
                  setPast((p) => [...p, draft]);
                  setDraft(future[0]);
                  setFuture((f) => f.slice(1));
                }}
              >
                Redo
              </button>
            </div>
          </div>
          {draft.sharedFields.map((f) => (
            <article className="shared-field" key={f.id}>
              <div className="shared-field-title">
                {f.id.startsWith("custom-") ? (
                  <label>
                    Field name
                    <input
                      disabled={busy}
                      aria-label={`Rename ${f.label}`}
                      value={f.label}
                      maxLength={80}
                      onChange={(e) => field(f.id, { label: e.target.value })}
                    />
                  </label>
                ) : (
                  <h3>{f.label}</h3>
                )}
                <button
                  onClick={() => remove(f)}
                  disabled={busy}
                  aria-label={`Remove ${f.label}`}
                >
                  Remove
                </button>
              </div>
              {f.type === "text" ? (
                <label className="sr-label">
                  <textarea
                    aria-label={f.label}
                    disabled={busy}
                    value={f.value}
                    maxLength={5000}
                    rows={f.id === "description" ? 4 : 2}
                    onChange={(e) => field(f.id, { value: e.target.value })}
                  />
                </label>
              ) : (
                <>
                  <div className="shared-photo">
                    {draft.assets[f.value] ? (
                      <Image
                        unoptimized
                        src={draft.assets[f.value].src}
                        width={180}
                        height={120}
                        alt={f.label}
                      />
                    ) : (
                      <p role="alert">
                        Shared image unavailable. Replace it to repair this
                        field.
                      </p>
                    )}
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => {
                      imageField.current = f.id;
                      upload.current.click();
                    }}
                  >
                    Replace shared photo
                  </button>
                  <p>
                    Each design keeps its own crop, position and size.
                    Overridden photos stay unchanged.
                  </p>
                </>
              )}
              <small>
                {snapshot.records.reduce(
                  (n, r) =>
                    n +
                    r.document.elements.filter(
                      (e) =>
                        e.binding?.campaignId === id &&
                        e.binding.fieldId === f.id &&
                        !e.localOverride,
                    ).length,
                  0,
                )}{" "}
                connected ·{" "}
                {snapshot.records.reduce(
                  (n, r) =>
                    n +
                    r.document.elements.filter(
                      (e) =>
                        e.binding?.campaignId === id &&
                        e.binding.fieldId === f.id &&
                        e.localOverride,
                    ).length,
                  0,
                )}{" "}
                overridden
              </small>
            </article>
          ))}
          <button
            className="button button-outline"
            onClick={() =>
              edit({
                ...draft,
                sharedFields: [
                  ...draft.sharedFields,
                  {
                    id: `custom-${crypto.randomUUID()}`,
                    label: "New field",
                    type: "text",
                    value: "",
                  },
                ],
              })
            }
            disabled={busy || draft.sharedFields.length >= 50}
          >
            + Add custom field
          </button>
          <div className="connected-recovery">
            <button
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    "Discard the unsaved campaign draft and reload saved values?",
                  )
                )
                  reload(true);
              }}
            >
              Reload saved values
            </button>
            <button onClick={backup}>Download campaign draft</button>
            <button onClick={() => draftUpload.current.click()}>
              Import campaign draft
            </button>
            <p>
              Draft backups preserve information for recovery; editable design
              downloads from the editor include their connected campaign.
            </p>
          </div>
        </section>
        <section className="connected-designs">
          <div className="connected-preview-heading">
            <h2>Your connected designs</h2>
            <span>{snapshot.records.length} designs</span>
          </div>
          <div ref={previewGrid} className="connected-design-grid">
            {plan?.records.map((r) => {
              const warnings = documentWarnings(r.document, browserMeasure),
                overrides = r.document.elements.filter(
                  (e) => e.binding?.campaignId === id && e.localOverride,
                );
              return (
                <article key={r.id} className="connected-design-card">
                  <DocumentPreview
                    document={r.document}
                    label={`${r.document.name} live connected preview`}
                  />
                  <div>
                    <h3>{r.document.name}</h3>
                    <p>
                      {r.document.canvas.width} × {r.document.canvas.height} px
                      · {overrides.length} overrides
                    </p>
                    {overrides.length > 0 && (
                      <ul>
                        {overrides.map((e) => (
                          <li key={e.id}>
                            {draft.sharedFields.find(
                              (f) => f.id === e.binding.fieldId,
                            )?.label || e.binding.fieldId}
                            : local{" "}
                            {e.type === "text"
                              ? e.text || "(intentionally empty)"
                              : "photo"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {warnings.map((w, i) => (
                      <p className="fit-warning" role="status" key={i}>
                        {w}
                      </p>
                    ))}
                    <Link
                      className="button button-outline"
                      href={`/editor/${r.id}`}
                      onClick={(e) => {
                        if (dirty) {
                          e.preventDefault();
                          setError(
                            "Save the shared changes before opening a design, or reload saved values.",
                          );
                        }
                      }}
                    >
                      Edit design / manage overrides →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="additional-design">
            <h3>Add another connected design</h3>
            <label>
              Format
              <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
                {Object.entries(RATIOS).map(([id, r]) => (
                  <option key={id} value={id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button"
              disabled={busy || dirty}
              onClick={addDesign}
            >
              Create from this campaign +
            </button>
          </div>
        </section>
      </div>
      {dirty&&<button className="button connected-mobile-save" disabled={busy||!!plan?.error} onClick={save}>Save shared changes</button>}
      <input
        ref={draftUpload}
        hidden
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          if (e.target.files[0]) importDraft(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={upload}
        hidden
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files[0]) photo(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </section>
  );
}
