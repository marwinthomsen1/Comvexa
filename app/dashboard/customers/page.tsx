import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function CustomersPage() {
  return (
    <PlanGate moduleName="Customers">
      <CardWorkspacePage
        table="customers"
        title="Customers"
        eyebrow="Customer directory"
        description="Manage customer profiles as contact cards with quick search and customer details."
        actionLabel="Add customer"
        titleKey="name"
        metaKeys={["email", "phone", "address"]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "address", label: "Address" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
