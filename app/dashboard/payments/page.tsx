import { SupabaseCrudPage } from "../_components/supabase-crud-page";
import { PaymentGate } from "../_components/payment-gate";

export default function PaymentsPage() {
  return (
    <PaymentGate>
    <SupabaseCrudPage
      table="payments"
      title="Payments"
      description="Record payments, methods, dates, notes, and amounts for the current company."
      actionLabel="Record payment"
      fields={[
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "payment_method", label: "Payment method", type: "select", options: ["Card", "Bank transfer", "Cash", "Online"] },
        { name: "payment_date", label: "Payment date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "amount", label: "Amount", format: "currency" },
        { key: "payment_method", label: "Method" },
        { key: "payment_date", label: "Payment date", format: "date" },
        { key: "notes", label: "Notes" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
    />
    </PaymentGate>
  );
}
