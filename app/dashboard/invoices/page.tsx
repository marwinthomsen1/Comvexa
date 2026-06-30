import { SupabaseCrudPage } from "../_components/supabase-crud-page";
import { PaymentGate } from "../_components/payment-gate";

export default function InvoicesPage() {
  return (
    <PaymentGate>
    <SupabaseCrudPage
      table="invoices"
      title="Invoices"
      description="Create invoices, track totals, due dates, and payment status."
      actionLabel="Create invoice"
      fields={[
        { name: "invoice_number", label: "Invoice number", required: true },
        { name: "total_amount", label: "Total amount", type: "number", required: true },
        { name: "payment_status", label: "Payment status", type: "select", options: ["Unpaid", "Paid", "Pending"] },
        { name: "due_date", label: "Due date", type: "date" },
      ]}
      columns={[
        { key: "invoice_number", label: "Invoice" },
        { key: "total_amount", label: "Total", format: "currency" },
        { key: "payment_status", label: "Payment status" },
        { key: "due_date", label: "Due date", format: "date" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
    />
    </PaymentGate>
  );
}
