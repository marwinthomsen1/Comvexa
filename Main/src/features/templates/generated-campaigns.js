"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { designStore } from "@/lib/editor/store";
import { RATIOS } from "@/lib/templates/catalog";
import "./templates.css";
export function GeneratedCampaigns() {
  const [items, setItems] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    designStore
      .listPackages()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="generated-campaigns">
      <h2>Your design packages</h2>
      <p>
        Campaign information and generated artwork saved in this browser. Open a
        campaign to update its connected designs together.
      </p>
      {error && <p role="alert">{error}</p>}
      {!items && !error && <p role="status">Loading design packages…</p>}
      {items?.length === 0 && (
        <p>
          No generated packages yet.{" "}
          <Link className="text-link" href="/dashboard/packages">
            Create your first package →
          </Link>
        </p>
      )}
      {items?.map((item) => (
        <article className="generated-campaign-card" key={item.id}>
          <span className="eyebrow">BROWSER-LOCAL CAMPAIGN</span>
          <h3>
            <Link href={`/dashboard/connected/${item.id}`}>{item.name} ↗</Link>
          </h3>
          <Link className="button" href={`/dashboard/connected/${item.id}`}>
            Manage connected information
          </Link>
          <p>{item.fields.description}</p>
          <p>
            {[item.fields.price, item.fields.contact, item.fields.link]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <nav aria-label={`Designs in ${item.name}`}>
            {item.designIds.map((id, index) => (
              <Link key={id} href={`/editor/${id}`}>
                {item.designIds.length === 4
                  ? Object.values(RATIOS)[index].label
                  : "Open design"}{" "}
                ↗
              </Link>
            ))}
          </nav>
        </article>
      ))}
    </section>
  );
}
