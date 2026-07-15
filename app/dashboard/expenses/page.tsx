import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function ExpensesPage() {
  return (
    <PlanGate moduleName="Expenses">
      <CardWorkspacePage
        table="expenses"
        title="Expenses"
        eyebrow="Cost tracker"
        description="Track business costs as expense cards grouped by category, vendor, and payment date."
        actionLabel="Add expense"
        titleKey="title"
        metaKeys={["category", "vendor", "payment_method"]}
        moneyKey="amount"
        dateKey="expense_date"
        variant="expenses"
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "category", label: "Category" },
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "tax_amount", label: "Tax amount", type: "number" },
          { name: "expense_date", label: "Expense date", type: "date" },
          { name: "payment_method", label: "Payment method" },
          { name: "vendor", label: "Vendor" },
        ]}
      />
    </PlanGate>
  );
}
