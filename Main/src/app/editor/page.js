"use client";
import "@/features/editor/editor.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { designStore } from "@/lib/editor/store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export default function DesignLibrary() {
  const [items, setItems] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    designStore
      .list()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="design-library wrap" id="main-content">
      <Link href="/dashboard">← Dashboard</Link>
      <ThemeToggle />
      <h1>Your design studio.</h1>
      <p>
        Editable designs saved in this browser. Download project files for
        backup; cloud saving is unavailable.
      </p>
      <Link className="button" href="/editor/new">
        Create a design +
      </Link>
      <div className="package-dashboard-actions">
        <Link className="text-link" href="/dashboard/templates">
          Browse templates →
        </Link>
        <Link className="text-link" href="/dashboard/packages">
          Create design package →
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      {items?.length === 0 && (
        <p>Your first design starts with a blank canvas.</p>
      )}
      <div className="design-library-grid">
        {items?.map((item) => (
          <Link
            href={`/editor/${item.id}`}
            key={item.id}
            className="detail-panel"
          >
            <span className="eyebrow">
              {item.provenance
                ? "GENERATED · " + item.provenance.ratio.toUpperCase()
                : "LOCAL DESIGN"}
            </span>
            <h2>{item.name}</h2>
            <p>
              {item.canvas.width} × {item.canvas.height} px
            </p>
            <small>{new Date(item.updatedAt).toLocaleString()}</small>
            <span>Open editor →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
