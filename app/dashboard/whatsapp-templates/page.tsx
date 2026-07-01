import { PlanGate } from "../_components/plan-gate";
import { RecordCrudPage } from "../_components/record-crud-page";

export default function WhatsAppTemplatesPage() {
  return (
    <PlanGate moduleName="WhatsApp Templates">
      <RecordCrudPage
        table="whatsapp_templates"
        title="WhatsApp Templates"
        description="Create reusable message templates for reminders, confirmations, and customer updates."
        actionLabel="Add template"
        fields={[
          { name: "name", label: "Template name", required: true },
          { name: "category", label: "Category", type: "select", options: ["Reminder", "Booking", "Payment", "General"] },
          { name: "status", label: "Status", type: "select", options: ["Active", "Draft", "Inactive"] },
          { name: "message", label: "Message", type: "textarea", required: true },
        ]}
        columns={[
          { key: "name", label: "Template" },
          { key: "category", label: "Category" },
          { key: "message", label: "Message" },
          { key: "status", label: "Status" },
        ]}
      />
    </PlanGate>
  );
}
