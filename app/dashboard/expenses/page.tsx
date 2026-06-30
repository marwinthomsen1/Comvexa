import { SupabaseCrudPage } from "../_components/supabase-crud-page";
import { PaymentGate } from "../_components/payment-gate";

export default function ExpensesPage() {
  return (
    <PaymentGate>
    <SupabaseCrudPage
      table="expenses"
      title="Expenses"
      description="Record business expenses, categories, tax amounts, vendors, payment methods, and notes."
      actionLabel="Add expense"
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "category", label: "Category" },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "tax_amount", label: "Tax amount", type: "number" },
        { name: "expense_date", label: "Expense date", type: "date" },
        { name: "payment_method", label: "Payment method", type: "select", options: ["Card", "Bank transfer", "Cash", "Online"] },
        { name: "vendor", label: "Vendor" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "title", label: "Expense" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", format: "currency" },
        { key: "tax_amount", label: "Tax", format: "currency" },
        { key: "vendor", label: "Vendor" },
        { key: "expense_date", label: "Date", format: "date" },
      ]}
    />
    </PaymentGate>
  );
}
