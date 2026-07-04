import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function CustomerPortalPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Customer Portal"
      title="Customer Portal"
      description="Prepare portal access, document requests, customer invoice views, booking visibility, and client-facing notes."
      storageKey="comvexa-ultra-customer-portal"
      actionLabel="Add portal item"
      fields={[
        { name: "customer", label: "Customer", required: true },
        { name: "portalItem", label: "Portal item", required: true },
        { name: "type", label: "Type", type: "select", options: ["invoice view", "document request", "booking view", "message", "payment link"] },
        { name: "dueDate", label: "Due date", type: "date" },
        { name: "assignedTo", label: "Assigned to" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "customer", label: "Customer" },
        { key: "portalItem", label: "Portal item" },
        { key: "type", label: "Type" },
        { key: "dueDate", label: "Due" },
        { key: "assignedTo", label: "Owner" },
      ]}
    />
  );
}
