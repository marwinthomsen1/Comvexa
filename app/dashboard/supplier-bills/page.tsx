import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function SupplierBillsPage() {
  return (
    <PlanGate moduleName="Supplier Bills">
      <CardWorkspacePage
        table="supplier_bills"
        title="Supplier Bills"
        eyebrow="Payables"
        description="Track supplier bills as payable cards with due dates, status, and totals."
        actionLabel="Add bill"
        titleKey="supplier_name"
        metaKeys={["bill_number", "notes"]}
        moneyKey="total_amount"
        statusKey="payment_status"
        dateKey="due_date"
        variant="ledger"
        fields={[
          { name: "supplier_name", label: "Supplier name", required: true },
          { name: "bill_number", label: "Bill number" },
          { name: "total_amount", label: "Total amount", type: "number", required: true },
          { name: "payment_status", label: "Payment status", type: "select", options: ["Unpaid", "Paid", "Pending"] },
          { name: "due_date", label: "Due date", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
