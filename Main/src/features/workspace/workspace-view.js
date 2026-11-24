"use client";
import "./campaigns-refresh.css";
import { useState } from "react";
import { GeneratedCampaigns } from "@/features/templates/generated-campaigns";
import Link from "next/link";
import { useWorkspace } from "./workspace-provider";
import { CreateDialog } from "./create-dialog";
import { Icon } from "@/components/ui/icon";
import { PROJECT_SIZES } from "@/lib/workspace/validation";
function DraftCard({ item, kind, campaigns }) {
  const campaign = campaigns.find((entry) => entry.id === item.campaignId);
  return (
    <Link
      className={`draft-card draft-${kind}`}
      href={`/dashboard/${kind === "project" ? "projects" : "campaigns"}/${item.id}`}
    >
      <div className="draft-thumbnail">
        <Icon name={kind === "campaign" ? "link" : "folder"} />
        <span>
          {kind === "campaign"
            ? "CAMPAIGN"
            : PROJECT_SIZES[item.size]?.label.toUpperCase()}
        </span>
        <span className="draft-initial">
          {item.name.slice(0, 1).toUpperCase()}
        </span>
      </div>
      <div className="draft-info">
        <h3>{item.name}</h3>
        <p>
          {campaign?.name ||
            (kind === "campaign"
              ? "A home for connected projects"
              : "Standalone project")}
        </p>
        <span>
          Project collection <span aria-hidden="true">↗</span>
        </span>
      </div>
    </Link>
  );
}
export function WorkspaceView({ mode = "overview" }) {
  const { data, error } = useWorkspace();
  const [creating, setCreating] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const kind = mode === "campaigns" ? "campaign" : "project";
  const title =
    mode === "overview"
      ? `Make room for your ideas${data?.profile.displayName && data.profile.displayName !== "Creator" ? `, ${data.profile.displayName}` : ""}.`
      : mode === "projects"
        ? "Your projects."
        : "Your campaigns.";
  const items = data
    ? (kind === "campaign" ? data.campaigns : data.projects)
        .filter((item) =>
          `${item.name} ${item.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )
    : [];
  return (
    <section className={mode === "campaigns" ? "campaigns-page" : "workspace-collection"}>
      {mode === "campaigns" && <header className="campaigns-hero"><div><span className="eyebrow">THE BIG PICTURE, BEAUTIFULLY CONNECTED</span><h1>One story.<br/><em>Every moving part.</em></h1><p>Bring your matching designs and creative projects together.<br/>A little more organized. A lot more possibility.</p><Link href="/dashboard/packages">Create a design package <span aria-hidden="true">↗</span></Link></div><div className="campaigns-hero-art" aria-hidden="true"><span className="campaign-connection connection-one"/><span className="campaign-connection connection-two"/><div className="campaign-node node-one"><Icon name="image"/><span>THE POST</span></div><div className="campaign-node node-center"><Icon name="link"/><strong>One<br/><em>big idea.</em></strong></div><div className="campaign-node node-two"><Icon name="layers"/><span>THE WHOLE SET</span></div><span className="campaign-art-caption">CONNECTED BY DESIGN. MADE BY YOU.</span></div></header>}
      {mode === "campaigns" && <GeneratedCampaigns />}
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">
            {mode === "overview"
              ? "A LITTLE SPACE. A LOT OF POSSIBILITY."
              : "ORGANIZE YOUR NEXT CHAPTER"}
          </span>
          <h1>{title}</h1>
          <p>
            {mode === "campaigns"
              ? "Give every collection, launch, and next chapter a home."
              : "Start small. Keep creating. Everything begins with an idea."}
          </p>
        </div>
        <button
          className="button"
          disabled={!data}
          onClick={() => setCreating(kind)}
        >
          <Icon name="plus" />
          New {kind}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading your local workspace…</p>}
      {mode === "overview" && (
        <div className="workspace-welcome">
          <div>
            <span className="eyebrow">YOUR NEXT GOOD IDEA STARTS HERE</span>
            <h2>
              A little structure.
              <br />
              <em>More creative freedom.</em>
            </h2>
            <p>
              Create a campaign for your next collection or event, then add
              project drafts for each format.
            </p>
            <button
              className="text-link"
              disabled={!data}
              onClick={() => setCreating("campaign")}
            >
              Create a campaign <span>↗</span>
            </button>
          </div>
          <div className="welcome-visual" aria-hidden="true">
            <div>
              <span>ONE IDEA</span>
              <strong>
                Many
                <br />
                possibilities.
              </strong>
              <Icon name="spark" />
            </div>
            <span className="welcome-sticker">
              MAKE IT
              <br />
              YOUR OWN ↗
            </span>
          </div>
        </div>
      )}
      <div className="list-heading">
        <h2>
          {mode === "overview"
            ? "Recent projects"
            : `${kind === "project" ? "Projects" : "Campaigns"} ${data ? `(${kind === "project" ? data.projects.length : data.campaigns.length})` : ""}`}
        </h2>
        <div className="list-controls">
          <label className="search-field">
            <Icon name="search" />
            <span className="sr-only">Search {kind}s</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${kind}s…`}
            />
          </label>
          <label>
            <span className="sr-only">Sort {kind}s</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recent">Newest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>
      {data &&
        (items.length ? (
          <div className="draft-grid">
            {items.map((item) => (
              <DraftCard
                key={item.id}
                item={item}
                kind={kind}
                campaigns={data.campaigns}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name={kind === "project" ? "folder" : "link"} />
            </span>
            <h3>
              {query
                ? "No matches just yet."
                : `Your first ${kind} starts here.`}
            </h3>
            <p>
              {query
                ? "Try another name or clear your search."
                : `Create a ${kind} to give your idea a home. Open its design editor when you’re ready to create.`}
            </p>
            {query ? (
              <button
                className="button button-ghost"
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            ) : (
              <button
                className="button button-ghost"
                onClick={() => setCreating(kind)}
              >
                <Icon name="plus" />
                Create {kind}
              </button>
            )}
          </div>
        ))}
      {creating && (
        <CreateDialog kind={creating} onClose={() => setCreating(null)} />
      )}
    </section>
  );
}
