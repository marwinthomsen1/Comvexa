"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { designStore } from "@/lib/editor/store";
import { RATIOS } from "@/lib/templates/catalog";
import "./templates.css";
import DesignThumbnail from "@/features/workspace/design-thumbnail";
import {StudioIcon} from "@/components/ui/studio-icon";
export function GeneratedCampaigns() {
  const [items, setItems] = useState(null),
    [error, setError] = useState("");
  const [designs,setDesigns]=useState([]);
  useEffect(() => {
    const refresh=()=>Promise.all([designStore.listPackages(),designStore.list()]).then(([packages,records])=>{setItems(packages);setDesigns(records);}).catch(e=>setError(e.message));
    refresh();window.addEventListener("comvexa-design-change",refresh);return()=>window.removeEventListener("comvexa-design-change",refresh);
  }, []);
  return (
    <section className="generated-campaigns">
      <div className="connected-section-heading"><div><span className="eyebrow">IN SYNC. IN STYLE.</span><h2>Connected design sets <span>{items?.length||0}</span></h2><p>One update keeps your whole story in step.</p></div><Link href="/dashboard/packages">New design set <span aria-hidden="true">↗</span></Link></div>
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
          <div className="connected-card-visuals">{item.designIds.slice(0,4).map(id=>{const design=designs.find(d=>d.id===id);return design?<Link href={`/editor/${id}`} key={id} aria-label={`Edit ${design.name}`}><DesignThumbnail item={design}/></Link>:<span className="connected-preview-placeholder" key={id}><StudioIcon name="image" size={23}/></span>;})}</div><div className="connected-card-content"><span className="eyebrow"><StudioIcon name="link" size={12}/> {item.designIds.length} CONNECTED DESIGNS</span>
          <h3>
            <Link href={`/dashboard/connected/${item.id}`}>{item.name} ↗</Link>
          </h3>
          <Link className="button" href={`/dashboard/connected/${item.id}`}>
            Manage design set <span aria-hidden="true">↗</span>
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
          </nav></div>
        </article>
      ))}
    </section>
  );
}
