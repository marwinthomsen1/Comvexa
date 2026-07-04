import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function WhatsAppTemplatesPage() {
  return (
    <PlanGate moduleName="WhatsApp Templates">
      <CardWorkspacePage
        table="whatsapp_templates"
        title="WhatsApp Templates"
        eyebrow="Message library"
        description="Create reusable customer messages as template cards for reminders, bookings, payments, and updates."
        actionLabel="Add template"
        titleKey="name"
        metaKeys={["category", "message"]}
        statusKey="status"
        fields={[
          { name: "name", label: "Template name", required: true },
          { name: "category", label: "Category", type: "select", options: ["Reminder", "Booking", "Payment", "General"] },
          { name: "status", label: "Status", type: "select", options: ["Active", "Draft", "Inactive"] },
          { name: "message", label: "Message", type: "textarea", required: true },
        ]}
      />
    </PlanGate>
  );
}
