import { RecordCrudPage } from "../_components/record-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function CustomersPage() {
  return (
    <PlanGate moduleName="Customers">
    <RecordCrudPage
      table="customers"
      title="Customer Management"
      description="Create and manage customer profiles for the signed-in company workspace."
      actionLabel="Add customer"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "address", label: "Address" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
    />
    </PlanGate>
  );
}
