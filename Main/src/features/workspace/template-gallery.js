"use client";
import { useState } from "react";
import { templatePreviews } from "@/config/site";
import { DesignPreview } from "@/components/marketing/design-preview";
export function TemplateGallery() {
  const [category, setCategory] = useState("All");
  return (
    <>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">THE START OF SOMETHING GOOD</span>
          <h1>A little inspiration.</h1>
          <p>
            Template concepts for the creative platform. Applying templates is
            coming in Phase 4.
          </p>
        </div>
      </div>
      <div
        className="filter-tabs"
        role="group"
        aria-label="Filter template concepts"
      >
        {["All", "Product", "Event"].map((value) => (
          <button
            key={value}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="template-grid">
        {templatePreviews
          .filter((item) => category === "All" || item.category === category)
          .map((item) => (
            <article className="template-card" key={item.id}>
              <DesignPreview {...item} />
              <div>
                <h3>{item.name}</h3>
                <span>{item.category} · Concept only</span>
              </div>
              <p>Template generation coming soon</p>
            </article>
          ))}
      </div>
    </>
  );
}
