"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace-provider";
import { PROJECT_SIZES } from "@/lib/workspace/validation";
import { Icon } from "@/components/ui/icon";
export function CreateDialog({ kind, onClose, initialCampaignId = "" }) {
  const dialog = useRef(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { data, create } = useWorkspace();
  const router = useRouter();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const item = create(kind, values);
      onClose();
      router.push(
        `/dashboard/${kind === "campaign" ? "campaigns" : "projects"}/${item.id}`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save. Check browser storage permissions.",
      );
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="create-dialog"
      aria-labelledby="create-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">A NEW BEGINNING</span>
          <h2 id="create-title">New {kind}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="muted">
        {kind === "campaign"
          ? "Group designs around one product, event, or idea."
          : "Give your next design a name and a place to start."}{" "}
        Saved only on this browser.
      </p>
      <form onSubmit={submit}>
        <label>
          Name
          <input
            name="name"
            maxLength={80}
            required
            autoFocus
            placeholder={
              kind === "campaign"
                ? "e.g. Summer collection"
                : "e.g. Summer launch post"
            }
          />
        </label>
        <label>
          Description <span className="optional">optional</span>
          <textarea
            name="description"
            maxLength={500}
            rows={3}
            placeholder="A few words about your idea…"
          />
        </label>
        {kind === "project" && (
          <>
            <label>
              Canvas format
              <select name="size" defaultValue="square">
                {Object.entries(PROJECT_SIZES).map(([key, size]) => (
                  <option value={key} key={key}>
                    {size.label} · {size.width} × {size.height}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campaign <span className="optional">optional</span>
              <select name="campaignId" defaultValue={initialCampaignId}>
                <option value="">Standalone project</option>
                {data?.campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button" disabled={saving}>
            Create {kind}
            <Icon name="arrow" />
          </button>
        </div>
      </form>
    </dialog>
  );
}
