import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function ServicesPage() {
  return (
    <PlanGate moduleName="Services">
      <CardWorkspacePage
        table="services"
        title="Services & Products"
        eyebrow="Catalog"
        description="Build a clean price list for timed services, products, and flat-fee offers."
        actionLabel="Create item"
        titleKey="name"
        metaKeys={["duration_minutes", "description"]}
        moneyKey="price"
        statusKey="status"
        variant="catalog"
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "price", label: "Price", type: "number" },
          { name: "duration_minutes", label: "Duration minutes (0 for product)", type: "number" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
