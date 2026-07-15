import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function RecurringInvoicesPage() {
  return (
    <PlanGate moduleName="Recurring Invoices">
      <CardWorkspacePage
        table="recurring_invoices"
        title="Recurring Invoices"
        eyebrow="Subscription billing"
        description="Manage repeating invoice schedules as renewal cards with next invoice dates and status."
        actionLabel="Add recurring invoice"
        titleKey="title"
        metaKeys={["customer_name", "frequency", "notes"]}
        moneyKey="amount"
        statusKey="status"
        dateKey="next_invoice_date"
        variant="subscription"
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "customer_name", label: "Customer name" },
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "frequency", label: "Frequency", type: "select", options: ["Monthly", "Quarterly", "Yearly"] },
          { name: "next_invoice_date", label: "Next invoice date", type: "date" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Paused", "Cancelled"] },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
