import { PlanGate } from "../_components/plan-gate";
import { SupabaseCrudPage } from "../_components/supabase-crud-page";

export default function RecurringInvoicesPage() {
  return (
    <PlanGate moduleName="Recurring Invoices">
      <SupabaseCrudPage
        table="recurring_invoices"
        title="Recurring Invoices"
        description="Prepare recurring invoice schedules for repeat customers and subscriptions."
        actionLabel="Add recurring invoice"
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "customer_name", label: "Customer name" },
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "frequency", label: "Frequency", type: "select", options: ["Monthly", "Quarterly", "Yearly"] },
          { name: "next_invoice_date", label: "Next invoice date", type: "date" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Paused", "Cancelled"] },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        columns={[
          { key: "title", label: "Title" },
          { key: "customer_name", label: "Customer" },
          { key: "amount", label: "Amount", format: "currency" },
          { key: "frequency", label: "Frequency" },
          { key: "next_invoice_date", label: "Next date", format: "date" },
          { key: "status", label: "Status" },
        ]}
      />
    </PlanGate>
  );
}
