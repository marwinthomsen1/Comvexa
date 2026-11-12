"use client";
import { useState } from "react";
import Link from "next/link";
import { StudioIcon } from "@/components/ui/studio-icon";
import { connectElement, connectionAction } from "@/lib/connected/model";
export function ConnectionPanel({
  element,
  doc,
  campaigns,
  available,
  onApply,
  onError,
  onChooseCampaign,
  onOpenCampaign,
}) {
  const [choice, setChoice] = useState("");
  if (!element || !["text", "image"].includes(element.type)) return null;
  const campaign = campaigns.find((c) => c.id === element.binding?.campaignId),
    field = campaign?.sharedFields.find(
      (f) => f.id === element.binding?.fieldId,
    );
  const targets = campaigns.flatMap((c) =>
    c.sharedFields
      .filter((f) => f.type === (element.type === "text" ? "text" : "image"))
      .map((f) => ({ key: `${c.id}|${f.id}`, campaign: c, field: f })),
  );
  function act(action) {
    try {
      onApply(connectionAction(doc, element.id, action, campaigns));
    } catch (e) {
      onError(e.message);
    }
  }
  return (
    <section className="connection-panel">
      <h3>
        <StudioIcon name={element.binding ? "link" : "unlink"} size={15} />
        {element.binding
          ? element.localOverride
            ? "Custom value"
            : "Connected content"
          : "Independent content"}
      </h3>
      {element.binding ? (
        <>
          <p>
            {campaign?.name || "Missing campaign"} ·{" "}
            {field?.label || `Missing field: ${element.binding.fieldId}`}
          </p>
          <p>
            {element.localOverride
              ? "This element uses its own value, including an intentional empty value. Shared updates will leave it alone."
              : "Shared campaign updates change this content while keeping its layout. Typing or replacing the photo creates a local override."}
          </p>
          <div className="editor-row">
            <button
              disabled={element.locked}
              onClick={() =>
                act(element.localOverride ? "restore" : "override")
              }
            >
              {element.localOverride ? "Restore connection" : "Override field"}
            </button>
            <button disabled={element.locked} onClick={() => act("detach")}>
              Remove connection
            </button>
          </div>
          {campaign && (
            <Link
              className="text-link"
              href={`/dashboard/connected/${campaign.id}`}
              onClick={
                onOpenCampaign
                  ? (event) => onOpenCampaign(event, campaign.id)
                  : undefined
              }
            >
              Edit shared campaign information
            </Link>
          )}
        </>
      ) : (
        <p>
          Connect this element to reusable campaign information. Its position,
          font and styling stay yours.
        </p>
      )}
      <details className="connection-options">
        <summary>
          {element.binding
            ? "Change connection"
            : "Connect to shared information"}
        </summary>
        <label className="editor-field">
          Campaign
          <select
            value={campaigns[0]?.id || ""}
            disabled={element.locked}
            onChange={(e) => onChooseCampaign(e.target.value)}
          >
            <option value="">Choose campaign…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field">
          Connect to Campaign Field
          <select
            value={choice}
            disabled={element.locked}
            onChange={(e) => setChoice(e.target.value)}
          >
            <option value="">
              Choose a {element.type === "text" ? "text" : "photo"} field…
            </option>
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.field.label}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!choice || element.locked}
          onClick={() => {
            try {
              const target = targets.find((t) => t.key === choice);
              if (!target) throw new Error("Choose an available field.");
              onApply(
                connectElement(
                  doc,
                  element.id,
                  target.campaign,
                  target.field.id,
                ),
              );
            } catch (e) {
              onError(e.message);
            }
          }}
        >
          Connect element
        </button>
      </details>
    </section>
  );
}
