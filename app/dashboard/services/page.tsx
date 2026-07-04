import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function ServicesPage() {
  return (
    <PlanGate moduleName="Services">
      <CardWorkspacePage
        table="services"
        title="Services & Products"
        eyebrow="Catalog"
        description="Manage what your company sells as product/service cards with pricing and duration."
        actionLabel="Add item"
        titleKey="name"
        metaKeys={["duration_minutes", "description"]}
        moneyKey="price"
        statusKey="status"
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "price", label: "Price", type: "number" },
          { name: "duration_minutes", label: "Duration minutes", type: "number" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
