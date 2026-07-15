import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function WhiteLabelPage() {
  return (
    <LocalUltraCrudPage
      moduleName="White Label"
      title="White Label"
      description="Manage branded invoice, portal, PDF, color, and customer-facing presentation tasks."
      storageKey="comvexa-ultra-white-label"
      actionLabel="Add branding task"
      variant="white-label"
      fields={[
        { name: "asset", label: "Brand asset", required: true },
        { name: "type", label: "Type", type: "select", options: ["invoice", "portal", "pdf", "email", "signature"] },
        { name: "color", label: "Color or style" },
        { name: "owner", label: "Owner" },
        { name: "dueDate", label: "Due date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "asset", label: "Asset" },
        { key: "type", label: "Type" },
        { key: "color", label: "Style" },
        { key: "owner", label: "Owner" },
        { key: "dueDate", label: "Due" },
      ]}
    />
  );
}
