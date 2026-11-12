"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "./workspace-provider";
import { CreateDialog } from "./create-dialog";
import { PROJECT_SIZES } from "@/lib/workspace/validation";
import { Icon } from "@/components/ui/icon";
export function DraftDetail({ kind }) {
  const { id } = useParams();
  const { data, error } = useWorkspace();
  const [creating, setCreating] = useState(false);
  if (error)
    return (
      <p role="alert" className="form-error">
        {error}
      </p>
    );
  if (!data) return <p role="status">Loading local draft…</p>;
  const list = kind === "campaign" ? "campaigns" : "projects";
  const item = data[list].find((entry) => entry.id === id);
  if (!item)
    return (
      <div className="empty-state">
        <h1>Draft not found.</h1>
        <p>This item isn’t in this browser’s local workspace.</p>
        <Link className="button" href={`/dashboard/${list}`}>
          Back to {list}
        </Link>
      </div>
    );
  const campaign = data.campaigns.find((entry) => entry.id === item.campaignId);
  const projects = data.projects.filter((entry) => entry.campaignId === id);
  return (
    <>
      <Link className="text-link" href={`/dashboard/${list}`}>
        ← All {list}
      </Link>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">LOCAL {kind.toUpperCase()} DRAFT</span>
          <h1>{item.name}</h1>
          <p>{item.description || "A fresh space for your next idea."}</p>
        </div>
        {kind === "campaign" && (
          <button className="button" onClick={() => setCreating(true)}>
            <Icon name="plus" />
            New project
          </button>
        )}
      </div>
      <div className="detail-grid">
        <section className="detail-panel">
          <h2>At a glance</h2>
          <dl>
            <dt>Created</dt>
            <dd>
              {new Date(item.createdAt).toLocaleDateString("en-PH", {
                dateStyle: "medium",
              })}
            </dd>
            <dt>Saved to</dt>
            <dd>This browser only</dd>
            {kind === "project" && (
              <>
                <dt>Canvas</dt>
                <dd>
                  {PROJECT_SIZES[item.size]?.width} ×{" "}
                  {PROJECT_SIZES[item.size]?.height} px
                </dd>
                <dt>Campaign</dt>
                <dd>
                  {campaign ? (
                    <Link
                      className="text-link"
                      href={`/dashboard/campaigns/${campaign.id}`}
                    >
                      {campaign.name}
                    </Link>
                  ) : (
                    "Standalone project"
                  )}
                </dd>
              </>
            )}
          </dl>
        </section>
        <section className="detail-panel future-panel">
          <Icon name={kind === "campaign" ? "link" : "spark"} />
          <h2>
            {kind === "campaign"
              ? "A home for connected designs."
              : "Your canvas is coming."}
          </h2>
          <p>
            {kind === "campaign"
              ? "Project organization works in this preview. Shared fields, connected updates, and design packages will arrive in later phases."
              : "The editor, asset uploads, and exports are planned for Phase 3. Your project draft is ready for the next step."}
          </p>
          <span className="pill">COMING SOON</span>
        </section>
      </div>
      {kind === "campaign" && (
        <section className="campaign-projects">
          <h2>Projects in this campaign</h2>
          {projects.length ? (
            <div className="campaign-project-list">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                >
                  <Icon name="folder" />
                  {project.name}
                  <span>↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">
              No projects linked yet. Choose this campaign when creating a
              project.
            </p>
          )}
        </section>
      )}
      {creating && (
        <CreateDialog
          kind="project"
          initialCampaignId={item.id}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}
