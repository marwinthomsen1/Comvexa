import { PlanGate } from "../_components/plan-gate";
import { SupabaseCrudPage } from "../_components/supabase-crud-page";

export default function SupplierBillsPage() {
  return (
    <PlanGate moduleName="Supplier Bills">
      <SupabaseCrudPage
        table="supplier_bills"
        title="Supplier Bills"
        description="Track supplier bills, due dates, payment status, and payable amounts."
        actionLabel="Add bill"
        fields={[
          { name: "supplier_name", label: "Supplier name", required: true },
          { name: "bill_number", label: "Bill number" },
          { name: "total_amount", label: "Total amount", type: "number", required: true },
          { name: "payment_status", label: "Payment status", type: "select", options: ["Unpaid", "Paid", "Pending"] },
          { name: "due_date", label: "Due date", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        columns={[
          { key: "supplier_name", label: "Supplier" },
          { key: "bill_number", label: "Bill" },
          { key: "total_amount", label: "Total", format: "currency" },
          { key: "payment_status", label: "Status" },
          { key: "due_date", label: "Due date", format: "date" },
        ]}
      />
    </PlanGate>
  );
}
