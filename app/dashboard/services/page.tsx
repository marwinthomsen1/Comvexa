import { RecordCrudPage } from "../_components/record-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function ServicesPage() {
  return (
    <PlanGate moduleName="Services">
    <RecordCrudPage
      table="services"
      title="Services & Products"
      description="Create and manage the services or products your company sells."
      actionLabel="Add item"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "price", label: "Price", type: "number" },
        { name: "duration_minutes", label: "Duration minutes", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        { key: "price", label: "Price", format: "currency" },
        { key: "duration_minutes", label: "Duration" },
        { key: "status", label: "Status" },
      ]}
    />
    </PlanGate>
  );
}
