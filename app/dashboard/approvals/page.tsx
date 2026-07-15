import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function ApprovalsPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Approvals"
      title="Approvals"
      description="Manage approval requests for invoices, discounts, expenses, refunds, record deletes, and other sensitive actions."
      storageKey="comvexa-ultra-approvals"
      actionLabel="Add approval request"
      variant="approvals"
      fields={[
        { name: "request", label: "Request", required: true },
        { name: "type", label: "Type", type: "select", options: ["expense", "invoice", "refund", "discount", "delete", "other"] },
        { name: "requestedBy", label: "Requested by" },
        { name: "approver", label: "Approver" },
        { name: "dueDate", label: "Due date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "request", label: "Request" },
        { key: "type", label: "Type" },
        { key: "requestedBy", label: "Requested by" },
        { key: "approver", label: "Approver" },
        { key: "dueDate", label: "Due" },
      ]}
    />
  );
}
